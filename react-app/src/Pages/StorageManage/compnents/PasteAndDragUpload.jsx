/**
 * 粘贴上传和拖拽上传
 */
import React, { useEffect, Fragment, useState, useRef } from 'react'
import { InboxOutlined, DeleteOutlined } from '@ant-design/icons'
import { Modal, Input, message } from 'antd'
import { useSelector } from 'react-redux'
import copy from 'copy-text-to-clipboard'

import styles from './PasteAndDragUpload.module.less'
import { generateRandomResourceName, copyFormattedBySettings } from '../../../utils'
import * as messageCenter from '../../../utils/messageCenter'
import notiSyncBucket from '../../../utils/notiSyncBucket'

// 扫描 entry 对应的文件，或者扫描 entry 对应的文件夹中的所有文件及子文件夹中的所有文件
function scanEntry(entry) {
  return new Promise(res => {
    if (entry.isDirectory) {
      entry.createReader().readEntries(function (entries) {
        const fileEntries = []
        const dirEntries = []
        entries.forEach(e => {
          if (e.isDirectory) {
            dirEntries.push(e)
          } else {
            fileEntries.push(e)
          }
        })
        res(
          Promise.all([
            ...fileEntries.map(
              e =>
                new Promise(res => {
                  res(scanEntry(e))
                })
            ),
            ...dirEntries.map(
              e =>
                new Promise(res => {
                  res(scanEntry(e))
                })
            ),
          ])
        )
      })
    } else {
      // 删除前导 /
      // 删除文件名
      // 只留下相对路径
      // 当前路径的就是空字符串
      entry.file(file => {
        file.relativeDir = entry.fullPath
          .replace(/^\//, '')
          .replace(new RegExp(`${entry.name}$`), '')
        res(file)
      })
    }
  })
}

export default function PasteAndDragUpload({
  domain,
  bucketInfo,
  currentBucket,
  csp,
  resourcePrefix,
  pendingUploadPrefix,
  handleSetPendingUploadPrefix,
  resetPendingUploadPrefix,
}) {
  const settings = useSelector(state => state.settings)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [pendingResourceNotiModalVisible, setPendingResourceNotiModalVisible] = useState(false)
  const [pendingResourceList, setPendingResourceList] = useState([])
  const overlayRef = useRef(null)

  // 点击确定按钮，开始上传
  function handleUpload(pfx) {
    Promise.all(
      pendingResourceList.map(pr =>
        csp.upload({
          file: pr.file,
          key: `${pfx}${pr.relativeDir}${pr.fname}`,
          resourcePrefix,
        })
      )
    )
      .then(res => {
        if (!bucketInfo.isPrivateRead) {
          const uploadedResourceLinks = []
          res.forEach(
            resourceInfo =>
              resourceInfo.key &&
              uploadedResourceLinks.push(encodeURI(resourcePrefix + resourceInfo.key))
          )
          if (uploadedResourceLinks.length) {
            copyFormattedBySettings(settings.copyFormat, uploadedResourceLinks)
            message.success(
              uploadedResourceLinks.length > 1
                ? '全部上传成功，所有资源已复制到剪切板，刷新之后在列表可见'
                : '上传成功，已复制到剪切板，刷新之后在列表可见'
            )
            notiSyncBucket()
          }
        } else {
          // 是私有读的bucket，需要到后端获取 签名url
          const keys = []
          res.forEach(resourceInfo => resourceInfo.key && keys.push(resourceInfo.key))
          keys.length > 0 &&
            messageCenter
              .requestGetSignatureUrl({
                keys,
                domain,
              })
              .then(getSignatureUrlRes => {
                if (getSignatureUrlRes.success) {
                  copyFormattedBySettings(settings.copyFormat, getSignatureUrlRes.data)
                  message.success(
                    getSignatureUrlRes.data.length > 1
                      ? '全部上传成功，所有资源已复制到剪切板，刷新之后在列表可见'
                      : '上传成功，已复制到剪切板，刷新之后在列表可见'
                  )
                } else {
                  message.error(`获取签名url失败： ${getSignatureUrlRes.msg}`)
                }
              })
              .catch(e => {
                message.error(`获取签名url失败： ${e}`)
              })
        }
      })
      .catch(res => {
        message.error(`上传失败 ${res}`)
      })
      .finally(() => {
        setPendingResourceList([])
      })
  }

  function handleUploadScreenshot(file) {
    csp
      .upload({
        file: file,
        key: `${pendingUploadPrefix}${generateRandomResourceName(file.name, false)}`,
        resourcePrefix,
        shouldCopy: false,
        shouldShowMsg: false,
      })
      .then(res => {
        if (res.key) {
          if (!bucketInfo.isPrivateRead) {
            const targetUrl = `${resourcePrefix}${res.key}`
            copyFormattedBySettings(settings.copyFormat, targetUrl)
            notiSyncBucket()
            message.success('上传成功，已复制到剪切板，刷新之后在列表可见')
          } else {
            messageCenter
              .requestGetSignatureUrl({
                keys: [res.key],
                domain,
              })
              .then(getSignatureUrlRes => {
                if (getSignatureUrlRes.success) {
                  copyFormattedBySettings(settings.copyFormat, getSignatureUrlRes.data)
                  message.success('上传成功，已复制到剪切板，刷新之后在列表可见')
                } else {
                  message.error(`获取签名url失败： ${getSignatureUrlRes.msg}`)
                }
              })
              .catch(e => {
                message.error(`获取签名url失败： ${e}`)
              })
          }
        }
      })
      .catch(res => {
        message.error(`截图上传失败 ${res}`)
      })
  }

  function handlePaste(e) {
    const { items } = e.clipboardData
    const fileEntries = []
    const dirEntries = []
    let screentshotFile = null

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      // 粘贴的内容会比较复杂：单个文件、多个文件、截图、字符串、带样式的字符串等
      if (item.kind === 'file') {
        // 防止拖入一些非文件的东西
        const item = items[i]
        const e = item.webkitGetAsEntry()
        if (e === null) {
          // 截图粘贴上传
          screentshotFile = item.getAsFile()
        } else {
          if (e.isDirectory) {
            dirEntries.push(e)
          } else {
            fileEntries.push(e)
          }
        }
      }
    }

    if (screentshotFile) {
      handleUploadScreenshot(screentshotFile)
    } else if (fileEntries.length || dirEntries.length) {
      Promise.all([...fileEntries, ...dirEntries].map(entry => scanEntry(entry))).then(r => {
        // 把获得的数组抹平
        const fileList = r.flat(1000)
        const newPendingReourceList = fileList.map(f => ({
          fname: generateRandomResourceName(f.name, settings.uploadUseOrignalFileName),
          file: f,
          relativeDir: f.relativeDir,
        }))

        setPendingResourceList(newPendingReourceList)
      })
      setPendingResourceNotiModalVisible(true)
    } else {
      message.error('粘贴的内容不支持上传')
    }
  }

  function handleDelete(ind) {
    const finalList = [...pendingResourceList.slice(0, ind), ...pendingResourceList.slice(ind + 1)]

    if (!finalList.length) {
      setPendingResourceNotiModalVisible(false)
      resetPendingUploadPrefix()
    }
    setPendingResourceList(finalList)
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
      const { files, types, items } = e.dataTransfer
      const fileEntries = []
      const dirEntries = []
      // 防止拖入一些非文件的东西
      if (types[0] === 'Files') {
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          const e = item.webkitGetAsEntry()
          if (e.isDirectory) {
            dirEntries.push(e)
          } else {
            fileEntries.push(e)
          }
        }
        Promise.all([...fileEntries, ...dirEntries].map(entry => scanEntry(entry))).then(r => {
          // 把获得的数组抹平
          const fileList = r.flat(1000)
          const newPendingReourceList = fileList.map(f => ({
            fname: generateRandomResourceName(f.name, settings.uploadUseOrignalFileName),
            file: f,
            relativeDir: f.relativeDir,
          }))

          setPendingResourceList(newPendingReourceList)
          setPendingResourceNotiModalVisible(true)
        })
      } else {
        message.error('拖拽的内容不支持上传')
      }
    }

    document.addEventListener('dragenter', handleDragEnter)
    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('drop', handleDrop)
    window.addEventListener('paste', handlePaste)

    return () => {
      document.removeEventListener('dragenter', handleDragEnter)
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('dragleave', handleDragLeave)
      document.removeEventListener('drop', handleDrop)
      window.removeEventListener('paste', handlePaste)
    }
  }, [resourcePrefix, pendingUploadPrefix, settings.copyFormat])
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
          {pendingResourceList.map((pr, ind) => (
            <div key={pr.fname} className={styles.listItem}>
              <DeleteOutlined
                onClick={() => handleDelete(ind)}
                title="删除"
                style={{ color: 'red', fontSize: 14 }}
                className={styles.delete}
              />
              <span>路径：{`${pendingUploadPrefix}${pr.relativeDir}${pr.fname}`}</span>
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
            <div className={styles.noti}>
              <div>
                bucket {'=>'} {currentBucket}
              </div>
              <div>
                目录 {'=>'} {pendingUploadPrefix.length ? pendingUploadPrefix : '根'}
              </div>
            </div>
          </div>
        </div>
      )}
    </Fragment>
  )
}
