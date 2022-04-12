import React, { useEffect, useState, Fragment } from 'react'
import ReactDOM from 'react-dom'
import { Progress, notification, Button } from 'antd'
import EventEmitter from 'events'

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
    const newM = []
    manager.forEach(m => {
      if (m.id !== id) {
        newM.push(m)
      }
    })
    setManager(newM)
    notification.success({
      message: '提示',
      description: `${fname} 已取消上传`,
      placement: 'bottomRight',
    })
    removeFromCancelManager(id)
  }

  useEffect(() => {
    const process = info => {
      const newManager = []
      let shouldAddNewInfo = true
      manager.forEach(m => {
        if (m.id === info.id) {
          // 进度为 100 的直接删除
          shouldAddNewInfo = false
          if (info.percent !== 100) {
            newManager.push(info)
          } else {
            removeFromCancelManager(info.id)
          }
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

    ee.on('progress', process)
    return () => {
      ee.off('progress', process)
    }
  }, [manager, cancelManager])

  console.log('cancelManager', cancelManager)

  return (
    <Fragment>
      {manager.length > 0 && (
        <div className={styles.wrapper}>
          <div className={styles.title}>上传管理</div>
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
                <Button
                  size="small"
                  type="primary"
                  danger
                  onClick={() => handleCancel(fInfo.id, fInfo.fname)}
                >
                  取消
                </Button>
              </div>
            ))}
          </div>
        </div>
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