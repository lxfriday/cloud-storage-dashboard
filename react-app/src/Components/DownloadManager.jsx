import React, { useEffect, useState, Fragment } from 'react'
import ReactDOM from 'react-dom'
import { Progress, notification, Button, message } from 'antd'
import { CloudDownloadOutlined } from '@ant-design/icons'
import Draggable from 'react-draggable'
import * as messageCenter from '../utils/messageCenter'
import messageCommands from '../../../src/messageCommands'
import styles from './DownloadManager.module.less'

let tasks = []
let progressManager = {}

function removeTask(id) {
  const newTasks = []
  for (const _ of tasks) {
    if (_.id !== id) {
      newTasks.push(_)
    }
  }
  tasks = newTasks
}

function DownloadManager() {
  const [progressInfo, setProgressInfo] = useState({
    // id: percentage
  })

  function nProgress(_) {
    if (progressInfo[_.id]) {
      return (
        <Progress
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
          percent={Math.floor(Number(progressInfo[_.id]))}
          status="active"
        />
      )
    }
    return (
      <Progress
        strokeColor={{
          '0%': '#108ee9',
          '100%': '#87d068',
        }}
        percent={0}
        status="active"
      />
    )
  }

  function handleCancel(id) {
    messageCenter.requestCancelDownload(id).catch(e => {
      message.error('任务取消失败')
    })
  }

  useEffect(() => {
    function onProgress(ev) {
      const msg = ev.data
      if (msg.command === messageCommands.downloadManager_progress) {
        const { id, percentage } = msg.data
        // console.log('progress info', msg.data)
        progressManager = {
          ...progressManager,
          [id]: percentage,
        }
        if (Number(percentage) === 100) {
          setTimeout(() => {
            delete progressManager[id]
            removeTask(id)
            setProgressInfo({ ...progressManager })

            if (!tasks.length) {
              message.success('下载任务已执行完成')
            }
          }, 1500)
        }
        //  else {
        //   progressManager = {
        //     ...progressManager,
        //     [id]: percentage,
        //   }
        // }
        setProgressInfo({ ...progressManager })
      }
    }

    function onError(ev) {
      const msg = ev.data
      if (msg.command === messageCommands.downloadManager_error) {
        const { originalName, errMsg, id } = msg.data
        delete progressManager[id]
        removeTask(id)
        setProgressInfo({ ...progressManager })

        notification.error({
          message: '提示',
          description: (
            <div>
              <div>
                <b>{originalName}</b> 下载失败
              </div>
              <div>{errMsg}</div>
            </div>
          ),
        })
      }
    }

    function onCancel(ev) {
      const msg = ev.data
      if (msg.command === messageCommands.downloadManager_cancel) {
        const { id } = msg.data
        delete progressManager[id]
        removeTask(id)
        setProgressInfo({ ...progressManager })
      }
    }

    window.addEventListener('message', onProgress)
    window.addEventListener('message', onError)
    window.addEventListener('message', onCancel)
    return () => {
      window.removeEventListener('message', onProgress)
      window.removeEventListener('message', onError)
      window.removeEventListener('message', onCancel)
    }
  }, [])

  return (
    <Fragment>
      {tasks.length && (
        <Draggable handle={`.${styles.title}`} bounds="body">
          <div className={styles.wrapper}>
            <div className={styles.title}>
              <CloudDownloadOutlined style={{ color: '#389e0d', fontSize: 15, marginRight: 3 }} />
              下载管理
            </div>
            <div className={styles.fListWrapper}>
              {tasks.map(_ => (
                <div key={_.id} className={styles.fWrapper}>
                  <div className={styles.fLeftWrapper}>
                    <div className={styles.fname}>{_.fname}</div>
                    <div className={styles.progressWrapper}>{nProgress(_)}</div>
                  </div>
                  {Number(progressInfo[_.id]) !== 100 && (
                    <Button size="small" type="primary" danger onClick={() => handleCancel(_.id)}>
                      取消
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Draggable>
      )}
    </Fragment>
  )
}

const wrapperEle = document.createElement('div')
function renderDownloadManager() {
  ReactDOM.render(<DownloadManager />, wrapperEle)
  document.querySelector('#root').appendChild(wrapperEle)
}

function destroyDownloadManager() {
  ReactDOM.unmountComponentAtNode(wrapperEle)
}

function downloadManager(filesInfo) {
  // 来新任务，比较简单，把新任务加到列表里边去
  tasks = [...tasks, ...filesInfo]
}

export { renderDownloadManager, destroyDownloadManager, downloadManager }

// 下载失败的文件提示
