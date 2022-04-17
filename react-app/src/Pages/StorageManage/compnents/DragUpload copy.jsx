import React, { useEffect, Fragment, useState, useRef } from 'react'
import { InboxOutlined } from '@ant-design/icons'
import { Modal, Input } from 'antd'
import styles from './DragUpload.module.less'
import * as messageCenter from '../../../utils/messageCenter'
import { generateRandomResourceName } from '../../../utils'
import settings from '../../../utils/settings'

export default function DragUpload({
  resourcePrefix,
  pendingUploadPrefix,
  handleSetPendingUploadPrefix,
  resetPendingUploadPrefix,
}) {
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [pendingResourceNotiModalVisible, setPendingResourceNotiModalVisible] = useState(false)
  const [pendingResourceList, setPendingResourceList] = useState([])
  const overlayRef = useRef(null)

  // 点击确定按钮，开始上传
  function handleUpload(pfx) {
    const uploadMeta = pendingResourceList.map(pr => ({
      key: `${pfx}${pr.relativeDir}${pr.name}`,
      path: pr.path,
    }))
    const finalParams = {
      uploadMeta,
    }
    messageCenter.requestServerUploadFiles(finalParams)
  }

  useEffect(() => {
    function handleDragEnter(e) {
      e.preventDefault()
    }
    function handleDragOver(e) {
      e.preventDefault()
      setOverlayVisible(true)
    }
    function handleDragLeave(e) {
      e.preventDefault()
      if (!e.fromElement) {
        setOverlayVisible(false)
      }
    }
    function handleDrop(e) {
      e.preventDefault()
      setOverlayVisible(false)
      // 文件和文件夹的 dataTransfer.types[0] 为 'Files'
      const { files, types } = e.dataTransfer
      if (types[0] === 'Files') {
        const fileInfos = []
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          fileInfos.push({
            name: file.name,
            path: file.path,
          })
        }
        messageCenter.requestReadPaths(fileInfos).then(data => {
          // readPathsResult
          // [{
          //   relativeDir: string // 文件的相对文件夹，不包含文件名
          //   name: string // name 是真的文件名
          //   path: string // 文件在系统中的路径
          // }, ...]

          setPendingResourceList(
            data.readPathsResult.map(fInfo => {
              return {
                ...fInfo,
                name: generateRandomResourceName(fInfo.name, settings.uploadUseOrignalFileName),
              }
            })
          )
          setPendingResourceNotiModalVisible(true)
        })
      }
    }

    document.addEventListener('dragenter', handleDragEnter)
    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('drop', handleDrop)

    return () => {
      document.removeEventListener('dragenter', handleDragEnter)
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('dragleave', handleDragLeave)
      document.removeEventListener('drop', handleDrop)
    }
  }, [])
  return (
    <Fragment>
      <Modal
        width={1000}
        title={`上传文件(${pendingResourceList.length})`}
        visible={pendingResourceNotiModalVisible}
        onOk={() => {
          setPendingResourceNotiModalVisible(false)
          // 开始上传
          handleUpload(pendingUploadPrefix)
          resetPendingUploadPrefix()
        }}
        okText="上传"
        cancelText="取消"
        onCancel={() => {
          setPendingResourceNotiModalVisible(false)
          setPendingResourceList([])
          resetPendingUploadPrefix()
        }}
      >
        <div className={styles.uploadPrefixEditorWrapper}>
          <Input
            placeholder="输入 prefix"
            value={pendingUploadPrefix}
            onChange={handleSetPendingUploadPrefix}
          />
        </div>
        <div className={styles.pendingResourceListWrapper}>
          {pendingResourceList.map(pr => (
            <div key={pr.name} className={styles.listItem}>
              路径：{`${pendingUploadPrefix}${pr.relativeDir}${pr.name}`}
            </div>
          ))}
        </div>
      </Modal>
      {overlayVisible && (
        <div className={styles.wrapper}>
          {/* 避免拖拽拖到别的容器里面 */}
          <div className={styles.overlay} ref={overlayRef}></div>
          <div className={styles.innerWrapper}>
            <InboxOutlined style={{ fontSize: 150, color: '#ccc' }} />
            <div className={styles.noti}>拖拽到这里上传</div>
          </div>
        </div>
      )}
    </Fragment>
  )
}
