/**
 * 文件上传和文件夹上传
 */
import React, { useRef, useState, Fragment } from 'react'
import { Modal, Input, message } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { useSelector } from 'react-redux'

import { generateRandomResourceName, copyFormattedBySettings } from '../../../utils'
import notiSyncBucket from '../../../utils/notiSyncBucket'
import * as messageCenter from '../../../utils/messageCenter'
import styles from './SelectUpload.module.less'

export default function SelectUpload({
  domain,
  bucketInfo,
  children,
  isDirectory,
  multiple,
  csp,
  resourcePrefix,
  pendingUploadPrefix,
  handleSetPendingUploadPrefix,
  resetPendingUploadPrefix,
}) {
  const settings = useSelector(state => state.settings)
  const [pendingResourceNotiModalVisible, setPendingResourceNotiModalVisible] = useState(false)
  const [pendingResourceList, setPendingResourceList] = useState([])
  const inputEle = useRef(null)

  function handleShowExplore() {
    // 每次打开文件选择器之前重置 value，防止选择相同的文件无法触发 onChange 事件
    inputEle.current.value = null
    inputEle.current.click()
  }

  function onChange(e) {
    try {
      const { files } = e.target
      // 把设置相对文件夹
      const fileList = [...files]
      fileList.forEach(f => {
        f.relativeDir = f.webkitRelativePath.replace(new RegExp(`${f.name}$`), '')
      })
      const newPendingReourceList = fileList.map(f => ({
        fname: generateRandomResourceName(f.name, settings.uploadUseOrignalFileName),
        file: f,
        relativeDir: f.relativeDir,
      }))

      if (isDirectory) {
        // 如何是选择文件夹上传，则会出现弹窗提醒
        setPendingResourceList(newPendingReourceList)
        setPendingResourceNotiModalVisible(true)
      } else {
        // 如果是选择文件直传，则选择完就马上开始上传
        handleUpload(pendingUploadPrefix, newPendingReourceList)
      }
    } catch (e) {
      message.error('上传失败 ' + e)
    }
  }

  function handleUpload(pfx, resourceList, next) {
    Promise.all(
      resourceList.map(pr =>
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
        message.error(`上传失败： ${res}`)
      })
      .finally(() => {
        next && next()
      })
  }

  function handleDelete(ind) {
    const finalList = [...pendingResourceList.slice(0, ind), ...pendingResourceList.slice(ind + 1)]

    if (!finalList.length) {
      setPendingResourceNotiModalVisible(false)
      resetPendingUploadPrefix()
    }
    setPendingResourceList(finalList)
  }

  return (
    <Fragment>
      <Modal
        width={1000}
        title={`上传文件(${pendingResourceList.length})`}
        visible={pendingResourceNotiModalVisible}
        onOk={() => {
          setPendingResourceNotiModalVisible(false)
          // 开始上传
          handleUpload(pendingUploadPrefix, pendingResourceList, () => {
            setPendingResourceList([])
          })
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
      <span onClick={handleShowExplore}>
        <input
          ref={inputEle}
          type="file"
          {...(isDirectory ? { webkitdirectory: 'true' } : {})}
          multiple={multiple}
          style={{ display: 'none' }}
          onChange={onChange}
          onClick={e => e.stopPropagation()}
        />
        {children}
      </span>
    </Fragment>
  )
}
