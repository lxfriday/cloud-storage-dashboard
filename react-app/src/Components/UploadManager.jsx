import React, { useEffect, useState, Fragment } from 'react'
import ReactDOM from 'react-dom'
import { Progress, notification, Button } from 'antd'
import EventEmitter from 'events'
import Draggable from 'react-draggable'

import styles from './UploadManager.module.less'

const ee = new EventEmitter()

let cancelManager = [
  // {
  //   id: '',
  //   onCancel: () => {}
  // }
]

function removeFromCancelManager(id) {
  const newCM = []
  cancelManager.forEach(cm => {
    if (cm.id !== id) {
      newCM.push(cm)
    }
  })
  cancelManager = newCM
}

function UploadManager() {
  const [manager, setManager] = useState([])

  function handleCancel(id, fname) {
    const target = cancelManager.find(cm => cm.id === id)
    target.onCancel && target.onCancel()
    removeFromManager(id)
    notification.success({
      message: '提示',
      description: `${fname} 已取消上传`,
      placement: 'bottomRight',
    })
    removeFromCancelManager(id)
  }

  function removeFromManager(id) {
    const newM = []
    manager.forEach(m => {
      if (m.id !== id) {
        newM.push(m)
      }
    })
    setManager(newM)
  }

  useEffect(() => {
    const process = info => {
      const newManager = []
      let shouldAddNewInfo = true
      manager.forEach(m => {
        if (m.id === info.id) {
          // 进度为 100 的直接删除
          shouldAddNewInfo = false
          newManager.push(info)
        } else {
          // 新加入的进度条
          newManager.push(m)
        }
      })
      if (shouldAddNewInfo) {
        newManager.push(info)
      }
      setManager(newManager)
    }

    let timer = setTimeout(() => {
      if (!manager.length) {
        return
      }
      const nManager = []
      manager.forEach(m => {
        if (m.percent !== 100) {
          nManager.push(m)
        } else {
          removeFromCancelManager(m.id)
        }
      })
      setManager(nManager)
    }, 1000)

    ee.on('progress', process)
    return () => {
      ee.off('progress', process)
      clearTimeout(timer)
    }
  }, [manager])

  console.log('cancelManager', { cancelManager, manager })

  return (
    <Fragment>
      {manager.length > 0 && (
        <Draggable handle={`.${styles.title}`} bounds="body">
          <div className={styles.wrapper}>
            <div className={styles.title}>
              上传管理<span>(长按可拖动)</span>
            </div>
            <div className={styles.fListWrapper}>
              {manager.map(fInfo => (
                <div key={fInfo.id} className={styles.fWrapper}>
                  <div className={styles.fLeftWrapper}>
                    <div className={styles.fname} title={fInfo.path}>
                      {fInfo.fname}
                    </div>
                    <div className={styles.progressWrapper}>
                      <Progress
                        strokeColor={{
                          '0%': '#108ee9',
                          '100%': '#87d068',
                        }}
                        percent={Math.floor(fInfo.percent)}
                        status="active"
                      />
                    </div>
                  </div>
                  {fInfo.percent !== 100 && (
                    <Button
                      size="small"
                      type="primary"
                      danger
                      onClick={() => handleCancel(fInfo.id, fInfo.fname)}
                    >
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
function renderUploadManager() {
  ReactDOM.render(<UploadManager />, wrapperEle)
  document.querySelector('#root').appendChild(wrapperEle)
}

function destroyUploadManager() {
  ReactDOM.unmountComponentAtNode(wrapperEle)
}

function uploadManager({ id, fname, percent, path }) {
  ee.emit('progress', { id, fname, percent, path })
}

function registerCancel({ id, onCancel }) {
  cancelManager.push({ id, onCancel })
}

export default uploadManager
export { renderUploadManager, destroyUploadManager, registerCancel }

// id 统一用的 key
// testfolder/竖版21649748398063_30879d52-3fd5-421f-ad99-c5d9337ba11d.mp4
