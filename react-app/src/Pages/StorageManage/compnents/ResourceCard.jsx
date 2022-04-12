import React, { useState } from 'react'
import {
  FileFilled,
  BugFilled,
  CopyFilled,
  DeleteFilled,
  ExclamationCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons'
import { message, Menu, Dropdown, Modal, Tooltip } from 'antd'
import copy from 'copy-text-to-clipboard'
import classnames from 'classnames'

import { getFullTime, getFileSize } from '../../../utils'

import styles from './ResourceCard.module.less'

export default function ResourceCard({
  isVideo,
  isImage,
  fsize,
  hash,
  url,
  mimeType,
  putTime,
  fkey,
  selected,
  handleToggleSelectKey,
  handleDeleteFile,
  handleSelectAll,
  debouncedHttpsErrorNotiWarning,
  debouncedHttpErrorNotiError,
  handlePreviewAsImg,
  handlePreviewAsVideo,
  handleDisableableHTTPS,
}) {
  const [isImgLoadError, setIsImgLoadError] = useState(false)
  const keyS = fkey.split('/')
  const fileFullName = keyS[keyS.length - 1]
  function handleImgLoadError(e) {
    if (e.target.src.indexOf('https://') === 0) {
      // 尝试使用 http 请求
      // const httpUrl = `http${e.target.src.substring(5)}`
      // e.target.src = httpUrl
      // setUrl(httpUrl)
      handleDisableableHTTPS()
      debouncedHttpsErrorNotiWarning()
    } else {
      setIsImgLoadError(true)
      debouncedHttpErrorNotiError()
    }
  }

  let finalImage = null

  if (isImage) {
    finalImage = (
      <img src={url} className={styles.img} onError={handleImgLoadError} draggable={false} />
    )
  } else if (isVideo) {
    finalImage = <PlayCircleOutlined style={{ color: '#aaa', fontSize: '60px' }} />
  } else if (isImgLoadError) {
    finalImage = <BugFilled style={{ color: '#aaa', fontSize: '60px' }} />
  } else {
    finalImage = <FileFilled style={{ color: '#aaa', fontSize: '70px' }} />
  }

  function handlePressDelete() {
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

  // 文件详情
  function handlePressDetail() {
    const d = new Date(+`${putTime}`.substr(0, 13))
    Modal.info({
      title: '文件详情',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>文件路径：{fkey}</p>
          <p>文件大小：{getFileSize(fsize)}</p>
          <p>Etag：{hash}</p>
          <p>mime：{mimeType}</p>
          <p>创建时间：{getFullTime(d)}</p>
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
      <Menu.Item key="1">刷新CDN</Menu.Item>
      <Menu.Divider />
      <Menu.Item key="2">重命名</Menu.Item>
      <Menu.Divider />
      <Menu.Item key="3" onClick={() => handleToggleSelectKey(fkey)}>
        选择
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="4" onClick={handleSelectAll}>
        全选
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="5"
        style={{ color: 'green' }}
        onClick={() => {
          copy(url)
          message.success('已复制到剪切板')
        }}
      >
        复制链接
      </Menu.Item>
      <Menu.Divider />
      {isImage && (
        <Menu.Item
          key="6"
          style={{ color: 'green' }}
          onClick={() => {
            copy(`![${fileFullName}](${url})`)
            message.success('已复制到剪切板')
          }}
        >
          复制链接(Markdown)
        </Menu.Item>
      )}
      <Menu.Divider />
      <Menu.Item key="7" style={{ color: 'red' }} onClick={handlePressDelete}>
        删除
      </Menu.Item>
    </Menu>
  )

  return (
    <Tooltip title={fkey}>
      <Dropdown overlay={contextMenu} trigger={['contextMenu']}>
        <div
          className={classnames(styles.wrapper, selected && styles.selected)}
          onClick={() => handleToggleSelectKey(fkey)}
          onDoubleClick={() => {
            if (isImage) {
              handlePreviewAsImg()
            } else if (isVideo) {
              handlePreviewAsVideo()
            } else {
              message.error('不支持预览的文件类型')
            }
          }}
        >
          <div className={styles.iconWrapper}>{finalImage}</div>
          <div className={styles.fileFullName}>{fileFullName}</div>
          <div className={styles.toolsWrapper}>
            <div className={styles.tools}>
              <div
                className={styles.buttonWrapper}
                onClick={() => {
                  copy(url)
                  message.success('已复制到剪切板')
                }}
              >
                <CopyFilled style={{ fontSize: '18px', color: 'green' }} />
              </div>
              <div className={styles.buttonWrapper} onClick={handlePressDelete}>
                <DeleteFilled style={{ fontSize: '18px', color: 'red' }} />
              </div>
            </div>
          </div>
        </div>
      </Dropdown>
    </Tooltip>
  )
}
