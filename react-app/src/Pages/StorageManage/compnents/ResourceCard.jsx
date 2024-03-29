import React, { Fragment, useState, useEffect } from 'react'
import {
  FileFilled,
  CopyFilled,
  DeleteFilled,
  ExclamationCircleOutlined,
  PlayCircleOutlined,
  ZoomInOutlined,
  CustomerServiceFilled,
  InfoCircleFilled,
  FileTextOutlined,
  RedoOutlined,
  CloudDownloadOutlined,
  EditFilled,
  SendOutlined,
  AppstoreFilled,
  AppstoreAddOutlined,
  CloudServerOutlined,
  LinkOutlined,
  CopyOutlined,
  FileMarkdownFilled,
  PictureFilled,
  AreaChartOutlined,
} from '@ant-design/icons'
import { message, Menu, Dropdown, Modal, Input, Radio, Tooltip } from 'antd'
import copy from 'copy-text-to-clipboard'
import classnames from 'classnames'
import { useSelector } from 'react-redux'

import { getFullTime, getFileSize } from '../../../utils'
import { storageClassMap, safelyGetStorageClass } from '../../../utils/cloudserviceprovider'
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
  storageClass,
  fkey,
  selected,
  fileFullName,
  isGridCell,
  handleToggleSelectKey,
  handleDeleteFile,
  handleSelectAll,
  handlePreviewAsImg,
  handleOpenInBrowser,
  handleRenameResource,
  handleRefreshResource,
  handleDownloadFile,
  handleUpdateStorageClass,
  handleGenTmpLink,
}) {
  const hasSignatureUrl = !!signatureUrl
  const isPrivateRead = bucketInfo.isPrivateRead
  const shouldUseSignatureUrl = hasSignatureUrl && isPrivateRead
  const deleteWithoutConfirm = useSelector(state => state.settings.deleteWithoutConfirm)
  // 用来预览的尾缀，压缩图像提升显示性能，但是和 刷新 CDN 有冲突，暂时禁用
  const imagePreviewSuffix = useSelector(state => state.settings.imagePreviewSuffix)
  const cspName = useSelector(state => state.settings.currentCSP.csp)
  const [renameOpModalVisible, setRenameOpModalVisible] = useState(false)
  const [moveOpModalVisible, setMoveOpModalVisible] = useState(false)
  const [updateStorageClassModalVisible, setUpdateStorageClassModalVisible] = useState(false)
  const [genTmpLinkModalVisible, setGenTmpLinkModalVisible] = useState(false)
  const [tmpLinkExpires, setTmpLinkExpires] = useState(3600)
  const [selectedStorageClass, setSelectedStorageClass] = useState(String(storageClass))
  const [newKey, setNewKey] = useState(fkey)
  let finalImage = null

  if (isImage) {
    //   <img
    //     src={isGif(fkey) ? url : url + imagePreviewSuffix}
    //     className={styles.img}
    //     draggable={false}
    //   />
    if (!isGridCell) {
      finalImage = <PictureFilled style={{ color: '#eee', fontSize: 16 }} />
    } else if (shouldUseSignatureUrl) {
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
    finalImage = <PlayCircleOutlined style={{ color: '#eee', fontSize: isGridCell ? 50 : 16 }} />
  } else if (isAudio) {
    finalImage = <CustomerServiceFilled style={{ color: '#eee', fontSize: isGridCell ? 50 : 16 }} />
  } else {
    finalImage = <FileFilled style={{ color: '#eee', fontSize: isGridCell ? 50 : 16 }} />
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
          <p>
            存储类型：
            {safelyGetStorageClass(cspName, storageClass).name} ({storageClass})
          </p>
        </div>
      ),
      width: 750,
      okText: '确定',
    })
  }

  const contextMenu = (
    <Menu style={{ borderRadius: 8, boxShadow: '0 0 4px #fff', border: '1px solid #ccc' }}>
      <Menu.Item
        key="view"
        onClick={handlePreviewAsImg}
        icon={<AreaChartOutlined style={{ color: '#4682B4', fontSize: 14 }} />}
      >
        查看
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="detail"
        onClick={handlePressDetail}
        icon={<FileTextOutlined style={{ color: '#4682B4', fontSize: 14 }} />}
      >
        详情
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="refreshcdn"
        onClick={handleRefreshResource}
        icon={<RedoOutlined style={{ color: 'brown', fontSize: 14 }} />}
      >
        刷新CDN
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="download"
        onClick={handleDownloadFile}
        icon={<CloudDownloadOutlined style={{ color: '#0000CC ', fontSize: 14 }} />}
      >
        下载
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="rename"
        onClick={() => setRenameOpModalVisible(true)}
        icon={<EditFilled style={{ color: '#FF0000 ', fontSize: 14 }} />}
      >
        重命名
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="move"
        onClick={() => setRenameOpModalVisible(true)}
        icon={<SendOutlined style={{ color: '#FF1493 ', fontSize: 14 }} />}
      >
        移动
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="select"
        onClick={() => handleToggleSelectKey(fkey)}
        icon={<AppstoreAddOutlined style={{ color: '#8B008B  ', fontSize: 14 }} />}
      >
        选择
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="selectall"
        onClick={handleSelectAll}
        icon={<AppstoreFilled style={{ color: '#8B4513  ', fontSize: 14 }} />}
      >
        全选
      </Menu.Item>
      <Menu.Divider />
      {isPrivateRead && [
        <Menu.Item
          key="gentmplink"
          onClick={() => setGenTmpLinkModalVisible(true)}
          icon={<LinkOutlined style={{ color: '#2F4F4F   ', fontSize: 14 }} />}
        >
          生成临时链接
        </Menu.Item>,
        <Menu.Divider key="divider" />,
      ]}
      <Menu.Item
        key="updatestorageclass"
        onClick={() => setUpdateStorageClassModalVisible(true)}
        disabled={!safelyGetStorageClass(cspName, storageClass).canChange}
        icon={<CloudServerOutlined style={{ color: '#FF4500   ', fontSize: 14 }} />}
      >
        修改存储类型{!safelyGetStorageClass(cspName, storageClass).canChange && '(需解冻)'}
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="copy"
        onClick={() => {
          if (shouldUseSignatureUrl) {
            copy(signatureUrl)
          } else {
            copy(url)
          }
          message.success('已复制到剪切板')
        }}
        icon={<CopyOutlined style={{ color: 'green', fontSize: 14 }} />}
      >
        复制链接
      </Menu.Item>
      <Menu.Divider />
      {isImage && (
        <Menu.Item
          key="copyasmd"
          onClick={() => {
            if (shouldUseSignatureUrl) {
              copy(`![${fileFullName}](${signatureUrl})`)
            } else {
              copy(`![${fileFullName}](${url})`)
            }
            message.success('已复制到剪切板')
          }}
          icon={<FileMarkdownFilled style={{ color: 'green', fontSize: 14 }} />}
        >
          复制链接(MD)
        </Menu.Item>
      )}
      <Menu.Divider />
      <Menu.Item
        key="delete"
        style={{ color: 'red' }}
        onClick={handlePressDelete}
        icon={<DeleteFilled style={{ color: 'red', fontSize: 14 }} />}
      >
        删除
      </Menu.Item>
    </Menu>
  )
  const finalExtName = ext && ext.length ? ext : 'unknown'
  const finalExtIsKnown = !(ext && ext.length)

  useEffect(() => {
    setSelectedStorageClass(String(storageClass))
  }, [storageClass])

  return (
    <Fragment>
      <Modal
        title={
          <span>
            <InfoCircleFilled style={{ color: '#EE7700 ', marginRight: 8 }} />
            修改存储类型
          </span>
        }
        width={700}
        visible={updateStorageClassModalVisible}
        onOk={() => {
          setUpdateStorageClassModalVisible(false)
          setSelectedStorageClass(String(storageClass))
          handleUpdateStorageClass({
            key: fkey,
            storageClass: selectedStorageClass,
            // 存储类型对应的中文提示，只用于弹窗提醒
            storageClassName: safelyGetStorageClass(cspName, selectedStorageClass).name,
          })
        }}
        onCancel={() => {
          setUpdateStorageClassModalVisible(false)
          setSelectedStorageClass(String(storageClass))
        }}
        okText="确定"
        cancelText="取消"
      >
        <div>
          <Radio.Group
            onChange={e => {
              setSelectedStorageClass(e.target.value)
            }}
            value={selectedStorageClass}
          >
            {Object.keys(storageClassMap[cspName]).map(_ => (
              <Radio key={_} value={_}>
                {storageClassMap[cspName][_].name}
              </Radio>
            ))}
          </Radio.Group>
        </div>
      </Modal>
      {/* 生成临时链接 */}
      <Modal
        title="生成临时链接（秒）"
        width={500}
        visible={genTmpLinkModalVisible}
        onOk={() => {
          handleGenTmpLink(fkey, tmpLinkExpires)
          setGenTmpLinkModalVisible(false)
          setTmpLinkExpires(3600)
        }}
        onCancel={() => {
          setGenTmpLinkModalVisible(false)
          setTmpLinkExpires(3600)
        }}
        okText="确定"
        cancelText="取消"
      >
        <Input
          type="number"
          placeholder="输入链接有效时间，单位：秒"
          value={tmpLinkExpires}
          onChange={e => setTmpLinkExpires(e.target.value)}
          onPaste={e => e.stopPropagation()}
          onPressEnter={() => {
            handleGenTmpLink(fkey, tmpLinkExpires)
            setGenTmpLinkModalVisible(false)
            setTmpLinkExpires(3600)
          }}
          autoFocus
        />
      </Modal>
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
          className={classnames(
            styles.wrapper,
            selected && styles.selected,
            isGridCell ? styles.isGridCell : styles.isListCell
          )}
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
          {!isGridCell && isImage && (
            <Tooltip
              overlayInnerStyle={{ boxShadow: '0 0 6px #fff', borderRadius: 3 }}
              mouseEnterDelay={0}
              placement="right"
              title={
                <div className={styles.imagePreviewTooltipWrapper}>
                  <img src={shouldUseSignatureUrl ? signatureUrl : url} />
                </div>
              }
            >
              <div className={styles.fileFullName}>{fileFullName}</div>
            </Tooltip>
          )}
          {(isGridCell || (!isGridCell && !isImage)) && (
            <div className={styles.fileFullName}>{fileFullName}</div>
          )}

          <div className={styles.storageClass}>
            {safelyGetStorageClass(cspName, storageClass).name} ({storageClass})
          </div>
          <div className={styles.fileSize}>{getFileSize(fsize)}</div>
          <div className={styles.createdTime}>{putTime}</div>
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
                <CopyFilled
                  style={{ fontSize: isGridCell ? 18 : 13, color: isGridCell ? 'green' : '#fff' }}
                />
              </div>
              <div
                className={classnames(styles.buttonWrapper, styles.isDelete)}
                onClick={e => {
                  e.stopPropagation()
                  handlePressDelete()
                }}
                title="删除"
              >
                <DeleteFilled
                  style={{ fontSize: isGridCell ? 18 : 13, color: isGridCell ? 'red' : 'red' }}
                />
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
                  <ZoomInOutlined
                    style={{ fontSize: isGridCell ? 18 : 13, color: isGridCell ? '#666' : '#fff' }}
                  />
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
                  <PlayCircleOutlined
                    style={{ fontSize: isGridCell ? 18 : 13, color: isGridCell ? '#666' : '#fff' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Dropdown>
    </Fragment>
  )
}
