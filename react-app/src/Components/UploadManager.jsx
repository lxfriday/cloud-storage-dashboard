import React, { useEffect, useState, Fragment } from 'react'
import ReactDOM from 'react-dom'
import { Progress, notification, Button } from 'antd'
import { CloudUploadOutlined } from '@ant-design/icons'
import EventEmitter from 'events'
import Draggable from 'react-draggable'

import styles from './UploadManager.module.less'
import { debounce } from '../utils'

const ee = new EventEmitter()

let cancelManager = [
  // {
  //   id: '',
  //   onCancel: () => {}
  // }
]

// 正在上传的文件数量
let uploadingCount = 0

// hack
// 防止点击取消之后，那条还触发了 uploadManager，导致进度卡死
const cancelledIDs = []

function removeFromCancelManager(id) {
  const newCM = []
  cancelManager.forEach(cm => {
    if (cm.id !== id) {
      newCM.push(cm)
    }
  })
  cancelManager = newCM
  uploadingCount--
}

function UploadManager() {
  const [manager, setManager] = useState([])

  function handleCancel(id, fname) {
    const target = cancelManager.find(cm => cm.id === id)
    target && target.onCancel && target.onCancel()
    removeFromCancelManager(id)
    cancelledIDs.push(id)
    removeFromManager(id)
    notification.success({
      message: '提示',
      description: `${fname} 已取消上传`,
      placement: 'bottomRight',
    })
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
    let timer = null
    let innerManager = []
    // 下面的延迟 2 秒清除已完成的条目比较复杂
    // 总规则：上传完成过后的2秒才会把已上传的那个条目给删掉

    function clearManager() {
      if (!innerManager.length) {
        return
      }
      const nManager = []
      innerManager.forEach(m => {
        if (m.percent !== 100) {
          nManager.push(m)
        }
      })
      innerManager = nManager
      setManager(innerManager)
    }

    const debouncedClearManager = debounce(clearManager, 2000, false)

    const process = info => {
      const newManager = []
      let shouldAddNewInfo = true
      innerManager.forEach(m => {
        if (m.id === info.id) {
          shouldAddNewInfo = false
          if (info.percent === 100) {
            removeFromCancelManager(m.id)
            if (!m.finishedTS) {
              newManager.push({ ...info, finishedTS: Date.now() })
            }
          } else {
            newManager.push(info)
          }
        } else {
          // 新加入的进度条
          if (!(m.finishedTS && Date.now() - m.finishedTS >= 2000)) {
            newManager.push(m)
          }
        }
      })
      if (shouldAddNewInfo) {
        uploadingCount++
        newManager.push(info)
      }
      innerManager = newManager
      setManager(innerManager)
      debouncedClearManager()
    }

    ee.on('progress', process)
    return () => {
      ee.off('progress', process)
      clearTimeout(timer)
    }
  }, [])

  let readUploadingCount = manager.length
  manager.forEach(fInfo => {
    if (cancelledIDs.includes(fInfo.id)) {
      readUploadingCount--
    }
  })

  return (
    <Fragment>
      {readUploadingCount > 0 && (
        <Draggable handle={`.${styles.title}`} bounds="body">
          <div className={styles.wrapper}>
            <div className={styles.title}>
              <CloudUploadOutlined style={{ color: '#389e0d', fontSize: 15, marginRight: 3 }} />
              上传管理<span>({uploadingCount})</span>
            </div>
            <div className={styles.fListWrapper}>
              {manager.map(fInfo => {
                if (!cancelledIDs.includes(fInfo.id)) {
                  return (
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
                  )
                } else {
                  return null
                }
              })}
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
  if (!cancelledIDs.includes(id)) {
    ee.emit('progress', { id, fname, percent, path })
  }
}

function registerCancel({ id, onCancel }) {
  cancelManager.push({ id, onCancel })
}

export default uploadManager
export { renderUploadManager, destroyUploadManager, registerCancel }

// id 统一用的 key
// testfolder/竖版21649748398063_30879d52-3fd5-421f-ad99-c5d9337ba11d.mp4
