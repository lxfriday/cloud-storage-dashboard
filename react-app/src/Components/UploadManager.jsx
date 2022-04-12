import React, { useEffect, useState, Fragment } from 'react'
import ReactDOM from 'react-dom'
import { Progress } from 'antd'
import EventEmitter from 'events'

import styles from './UploadManager.module.less'

const ee = new EventEmitter()

function UploadManager() {
  const [manager, setManager] = useState([])

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
  }, [manager])

  return (
    <Fragment>
      {manager.length > 0 && (
        <div className={styles.wrapper}>
          <div className={styles.title}>上传管理</div>
          <div className={styles.fListWrapper}>
            {manager.map(fInfo => (
              <div key={fInfo.id} className={styles.fWrapper}>
                <div className={styles.fname} title={fInfo.fname}>
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

function uploadManager({ id, fname, percent }) {
  ee.emit('progress', { id, fname, percent })
}

export default uploadManager
export { renderUploadManager, destroyUploadManager }
