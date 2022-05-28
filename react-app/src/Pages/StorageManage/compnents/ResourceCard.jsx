import React, { Fragment, useState, useEffect } from 'react'
import {
  FileFilled,
  CopyFilled,
  DeleteFilled,
  ExclamationCircleOutlined,
  PlayCircleOutlined,
  ZoomInOutlined,
  CustomerServiceFilled,
} from '@ant-design/icons'
import { message, Menu, Dropdown, Modal, Input } from 'antd'
import copy from 'copy-text-to-clipboard'
import classnames from 'classnames'
import { useSelector } from 'react-redux'

import { getFullTime, getFileSize } from '../../../utils'
import styles from './ResourceCard.module.less'

// 用来解决双击和单机事件冲突
let clickCount = 0

export default function ResourceCard({
  ext,
  bucketInfo,
  isAudio,
  isVideo,
  isImage,
  isGif,
  isSvg,
  fsize,
  hash,
  md5,
  url,
  signatureUrl,
  mimeType,
  putTime,
  fkey,
  selected,
  handleToggleSelectKey,
  handleDeleteFile,
  handleSelectAll,
  handlePreviewAsImg,
  handleOpenInBrowser,
  handleRenameResource,
  handleRefreshResource,
  handleDownloadFile,
  fileFullName,
}) {
  const hasSignatureUrl = !!signatureUrl
  const isPrivateRead = bucketInfo.isPrivateRead
  const shouldUseSignatureUrl = hasSignatureUrl && isPrivateRead
  const deleteWithoutConfirm = useSelector(state => state.settings.deleteWithoutConfirm)
  // 用来预览的尾缀，压缩图像提升显示性能，但是和 刷新 CDN 有冲突，暂时禁用
  const imagePreviewSuffix = useSelector(state => state.settings.imagePreviewSuffix)
  const [renameOpModalVisible, setRenameOpModalVisible] = useState(false)
  const [moveOpModalVisible, setMoveOpModalVisible] = useState(false)
  const [newKey, setNewKey] = useState(fkey)

  let finalImage = null

  if (isImage) {
    //   <img
    //     src={isGif(fkey) ? url : url + imagePreviewSuffix}
    //     className={styles.img}
    //     draggable={false}
    //   />
    if (shouldUseSignatureUrl) {
      finalImage = (
        <div
          style={{
            backgroundImage: `url("${signatureUrl}")`,
          }}
          className={styles.img}
        />
      )
    } else {
      finalImage = (
        <div
          style={{
            backgroundImage: `url("${isGif || isSvg ? url : url + imagePreviewSuffix}")`,
            // backgroundImage: `url("${url}")`,
          }}
          className={styles.img}
        />
      )
    }
  } else if (isVideo) {
    finalImage = <PlayCircleOutlined style={{ color: '#aaa', fontSize: '50px' }} />
  } else if (isAudio) {
    finalImage = <CustomerServiceFilled style={{ color: '#aaa', fontSize: '50px' }} />
  } else {
    finalImage = <FileFilled style={{ color: '#aaa', fontSize: '50px' }} />
  }

  function handlePressDelete() {
    if (deleteWithoutConfirm) {
      handleDeleteFile([fkey])
    } else {
      Modal.confirm({
        title: '确定删除以下文件？',
        icon: <ExclamationCircleOutlined />,
        content: url,
        width: 750,
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk() {
          handleDeleteFile([fkey])
        },
      })
    }
  }

  // 文件详情
  function handlePressDetail() {
    Modal.info({
      title: '文件详情',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>文件路径：{fkey}</p>
          <p>文件大小：{getFileSize(fsize)}</p>
          {!!hash && <p>Etag：{hash}</p>}
          {!!md5 && <p>md5：{md5}</p>}
          {!!mimeType && <p>mime：{mimeType}</p>}
          <p>创建时间：{putTime}</p>
        </div>
      ),
      width: 750,
      okText: '确定',
    })
  }

  const contextMenu = (
    <Menu>
      <Menu.Item key="0" onClick={handlePressDetail}>
        详情
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="1" onClick={handleRefreshResource}>
        刷新CDN
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="2" onClick={handleDownloadFile}>
        下载
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="3" onClick={() => setRenameOpModalVisible(true)}>
        重命名
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="4" onClick={() => setRenameOpModalVisible(true)}>
        移动
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="5" onClick={() => handleToggleSelectKey(fkey)}>
        选择
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="6" onClick={handleSelectAll}>
        全选
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="7"
        style={{ color: 'green' }}
        onClick={() => {
          if (shouldUseSignatureUrl) {
            copy(signatureUrl)
          } else {
            copy(url)
          }
          message.success('已复制到剪切板')
        }}
      >
        复制链接
      </Menu.Item>
      <Menu.Divider />
      {isImage && (
        <Menu.Item
          key="8"
          style={{ color: 'green' }}
          onClick={() => {
            if (shouldUseSignatureUrl) {
              copy(`![${fileFullName}](${signatureUrl})`)
            } else {
              copy(`![${fileFullName}](${url})`)
            }
            message.success('已复制到剪切板')
          }}
        >
          复制链接(Markdown)
        </Menu.Item>
      )}
      <Menu.Divider />
      <Menu.Item key="9" style={{ color: 'red' }} onClick={handlePressDelete}>
        删除
      </Menu.Item>
    </Menu>
  )
  const finalExtName = ext && ext.length ? ext : 'unknown'
  const finalExtIsKnown = !(ext && ext.length)

  return (
    <Fragment>
      {/* 移动和重命名实际上是一样的 */}
      <Modal
        title="重命名"
        width={700}
        visible={renameOpModalVisible}
        onOk={() => {
          handleRenameResource({ originalKey: fkey, newKey, op: 'rename' })
          setRenameOpModalVisible(false)
        }}
        onCancel={() => {
          setRenameOpModalVisible(false)
          setNewKey(fkey)
        }}
        okText="确定"
        cancelText="取消"
      >
        <Input
          type="text"
          value={newKey}
          onChange={e => setNewKey(e.target.value)}
          onPaste={e => e.stopPropagation()}
        />
      </Modal>
      <Modal
        title="移动"
        width={700}
        visible={moveOpModalVisible}
        onOk={() => {
          handleRenameResource({ originalKey: fkey, newKey, op: 'move' })
          setMoveOpModalVisible(false)
        }}
        onCancel={() => {
          setMoveOpModalVisible(false)
          setNewKey(fkey)
        }}
        okText="确定"
        cancelText="取消"
      >
        <Input
          type="text"
          value={newKey}
          onChange={e => setNewKey(e.target.value)}
          onPaste={e => e.stopPropagation()}
        />
      </Modal>
      <Dropdown overlay={contextMenu} trigger={['contextMenu']}>
        <div
          className={classnames(styles.wrapper, selected && styles.selected)}
          onClick={e => {
            clickCount += 1
            setTimeout(() => {
              if (clickCount === 1) {
                handleToggleSelectKey(fkey)
              } else if (clickCount === 2) {
                isImage && handlePreviewAsImg()
              }
              clickCount = 0
            }, 200)
          }}
          title={fileFullName}
        >
          <div className={classnames(styles.fileExtWrapper, finalExtIsKnown && styles.known)}>
            {finalExtName}
          </div>
          <div className={styles.iconWrapper}>{finalImage}</div>
          <div className={styles.fileFullName}>{fileFullName}</div>
          <div className={styles.toolsWrapper}>
            <div className={styles.operateZone}></div>
            <div className={styles.tools}>
              <div
                className={styles.buttonWrapper}
                onClick={e => {
                  e.stopPropagation()
                  if (shouldUseSignatureUrl) {
                    copy(signatureUrl)
                  } else {
                    copy(url)
                  }
                  message.success('已复制到剪切板')
                }}
                title="复制"
              >
                <CopyFilled style={{ fontSize: '18px', color: 'green' }} />
              </div>
              <div
                className={styles.buttonWrapper}
                onClick={e => {
                  e.stopPropagation()
                  handlePressDelete()
                }}
                title="删除"
              >
                <DeleteFilled style={{ fontSize: '18px', color: 'red' }} />
              </div>
              {isImage && (
                <div
                  className={styles.buttonWrapper}
                  onClick={e => {
                    e.stopPropagation()
                    handlePreviewAsImg()
                  }}
                  title="预览"
                >
                  <ZoomInOutlined style={{ fontSize: '18px', color: '#666' }} />
                </div>
              )}
              {(isVideo || isAudio) && (
                <div
                  className={styles.buttonWrapper}
                  onClick={e => {
                    e.stopPropagation()
                    handleOpenInBrowser()
                  }}
                  title="在浏览器中打开"
                >
                  <PlayCircleOutlined style={{ fontSize: '18px', color: '#666' }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </Dropdown>
    </Fragment>
  )
}
