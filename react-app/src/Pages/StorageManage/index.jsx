import React, { useEffect, useState, Fragment } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Select, message, Modal, Image, Input, notification } from 'antd'
import {
  FileOutlined,
  SyncOutlined,
  LinkOutlined,
  ProfileOutlined,
  ExclamationCircleOutlined,
  HomeFilled,
  FolderOpenOutlined,
} from '@ant-design/icons'
import copy from 'copy-text-to-clipboard'
import classnames from 'classnames'

import SelectUpload from './compnents/SelectUpload'
import ResourceList from './compnents/ResourceList'
import PasteAndDragUpload from './compnents/PasteAndDragUpload'
import { renderUploadManager, destroyUploadManager } from '../../Components/UploadManager'

import styles from './index.module.less'
import * as messageCenter from '../../utils/messageCenter'
import { debounce, getFileSize, isUrl, generateRandomResourceName } from '../../utils'
import settings from '../../utils/settings'
import cloudserviceprovider from '../../utils/cloudserviceprovider'

const { Option } = Select

const providerName = 'qiniu'
const csp = cloudserviceprovider[providerName]

let isLoadingResource = false // 是否正在加载资源

export default function StorageManage() {
  let [bucketDomainInfo, setBucketDomainInfo] = useState({
    bucketDomains: [],
    selectBucketDomain: '',
    resourcePrefix: '',
  })
  const resourcePrefix = `${settings.forceHTTPS ? 'https://' : 'http://'}${
    bucketDomainInfo.selectBucketDomain
  }/`
  let [uploadFolders, setUploadFolders] = useState([]) // ['testfolder/', 'job/'] => 最终路径 'testfolder/job/'
  let [resourceList, setResourceList] = useState([])
  // 文件夹列表
  let [commonPrefixList, setCommonPrefixList] = useState([])
  // 是否已经加载到最后一页了，加载完了没？
  let [isResourceListReachEnd, setIsResourceListReachEnd] = useState(false)
  // 粘贴、拖动上传时输入的前缀
  let [pendingUploadPrefix, setPendingUploadPrefix] = useState('')
  // 从网络上直接拉取资源到 bucket，目标 url
  let [fetchFromUrlTargetUrl, setFetchFromUrlTargetUrl] = useState('')
  let [fetchFromUrlModalVisible, setFetchFromUrlModalVisible] = useState(false)

  let [uploadToken, setUploadToken] = useState('')
  // 选中的资源 key
  let [selectedKeys, setSelectedKeys] = useState([])
  let [bucketOverviewInfo, setBucketOverviewInfo] = useState({ count: 0, space: 0 })
  // 图片预览是否显示
  let [imgPreviewVisible, setImgPreviewVisible] = useState(false)
  let [imgPreviewIndex, setImgPreviewIndex] = useState(0)

  let [searchParams] = useSearchParams()
  const currentBucket = searchParams.get('space')

  // 上传的时候 token 都从这里拿
  function ensureTokenAvailable() {
    messageCenter
      .requestGenerateUploadToken()
      .then(data => {
        setUploadToken(data)
      })
      .catch(err => {
        message.error('token 获取失败')
      })
  }

  function handleRefresh(prefixes = []) {
    // 刷新列表
    // 刷新文件数量，存储空间
    if (!isLoadingResource) {
      isLoadingResource = true
      setResourceList([])
      setUploadFolders([]) // 需要，否则点击返回上次层的时候，返回的图标会保留
      setCommonPrefixList([])
      messageCenter
        .requestGetResourceList({ fromBegin: true, prefix: prefixes.join('') })
        .then(data => {
          isLoadingResource = false
          setUploadFolders([...prefixes])
          setPendingUploadPrefix(prefixes.join(''))
          setCommonPrefixList(data.commonPrefixes)
          const nRList = []

          data.list.forEach(r => {
            // 七牛在网页端创建文件夹的时候，会自动创建一个空文件占位，把它删掉
            if (r.mimeType !== 'application/qiniu-object-manager') {
              nRList.push(r)
            }
          })
          setResourceList(nRList)
          setIsResourceListReachEnd(data.reachEnd)
        })
      handleGetOverviewInfo()
    }
  }

  // 加载列表数据，非第一页以后的调用这里
  function handleLoadData() {
    if (!isResourceListReachEnd && !isLoadingResource) {
      isLoadingResource = true
      messageCenter.requestGetResourceList({ prefix: uploadFolders.join('') }).then(data => {
        isLoadingResource = false
        // 对已有的 commonprefixes 和新传过来的 commonprefixes 做合并，去重
        setCommonPrefixList([...new Set([...commonPrefixList, ...data.commonPrefixes])])
        setResourceList([...resourceList, ...data.list])
        setIsResourceListReachEnd(data.reachEnd)
      })
    }
  }

  const debouncedHandleRefresh = debounce(handleRefresh, 2000, false)

  function handleChangeDomain(newDoamin) {
    setBucketDomainInfo({
      ...bucketDomainInfo,
      selectBucketDomain: newDoamin,
    })
  }

  function handleToggleSelectKey(key) {
    let newKeys = []
    if (selectedKeys.includes(key)) {
      for (let k of selectedKeys) {
        if (k !== key) {
          newKeys.push(k)
        }
      }
    } else {
      newKeys = [...selectedKeys, key]
    }

    setSelectedKeys(newKeys)
  }

  // 取消全选
  function handleCancelSelectAll() {
    setSelectedKeys([])
  }

  // 全选
  function handleSelectAll() {
    const keys = []
    resourceList.forEach(rs => keys.push(rs.key))
    setSelectedKeys(keys)
  }

  // 删除一个和删除多个文件都走这个函数
  function handleDeleteFiles(keys) {
    messageCenter.requestDeleteBucketFiles(keys).then(data => {
      if (data.result === 'alldeleted') {
        message.success('删除成功')
        const rList = []
        resourceList.forEach(r => {
          if (!keys.includes(r.key)) {
            rList.push(r)
          }
        })
        const nSelectedKeys = []
        selectedKeys.forEach(k => {
          if (!keys.includes(k)) {
            nSelectedKeys(k)
          }
        })
        setSelectedKeys(nSelectedKeys)
        setResourceList(rList)
      } else if (data.result === 'partdeleted') {
        message.error('部分文件删除成功')
        handleRefresh(uploadFolders)
      } else {
        message.error('删除失败')
      }
    })
  }

  // 工具条中点击删除，删除选中的文件
  function handleDeleteSelectedFiles() {
    handleDeleteFiles(selectedKeys)
  }

  function handleGetOverviewInfo() {
    messageCenter.requestGetOverviewInfo().then(overviewInfo => {
      // {count: 2457, space: 1373368131}
      setBucketOverviewInfo({
        count: overviewInfo.count,
        space: getFileSize(overviewInfo.space),
      })
    })
  }

  // 双击图片点击了预览，or右键点击了预览
  function handlePreviewAsImg(ind) {
    setImgPreviewVisible(true)
    setImgPreviewIndex(ind)
  }

  // 预览视频
  // function handlePreviewAsVideo(url) {
  //   videoPlayer.show(url)
  // }

  // 点击文件夹
  function handleViewFolder(pfx) {
    const targetFolders = [...uploadFolders, pfx]
    handleRefresh(targetFolders)
  }

  // 返回上层文件夹
  function handleBackward() {
    const beforeFolders = [...uploadFolders]
    beforeFolders.pop()
    handleRefresh(beforeFolders)
  }

  // 点击导航栏，直达某层文件夹
  function handleGoToTargetFolder(index, folderName) {
    const targetFolders = uploadFolders.slice(0, index + 1)
    handleRefresh(targetFolders)
  }

  // 点击回到最顶层文件夹
  function handleGoToHome() {
    handleRefresh([])
  }

  function handleComfirmFetchFromUrl(url, key) {
    let hasFinished = false
    setTimeout(() => {
      if (!hasFinished) {
        notification.warning({
          message: '注意',
          description: '抓取的文件过大，抓取所消耗的时间会比较长',
          duration: 20,
        })
      }
    }, 5000)
    if (isUrl(url)) {
      messageCenter
        .requestFetchResourceToBucket({
          url,
          key,
        })
        .then(data => {
          if (data.success) {
            copy(encodeURI(`${resourcePrefix}${key}`))
            message.success('资源抓取成功，已复制到剪切板')
          } else {
            message.error('资源抓取失败 ' + data.msg)
          }
        })
        .catch(e => {
          message.error('资源抓取失败')
        })
        .finally(() => {
          hasFinished = true
        })
      setFetchFromUrlTargetUrl('')
      setFetchFromUrlModalVisible(false)
    } else {
      message.error('url 格式不正确')
    }
  }

  useEffect(async () => {
    // 打开一个 bucket 的时候，更新 localside bucket
    setResourceList([])
    setUploadFolders([])
    setCommonPrefixList([])
    setPendingUploadPrefix('')
    try {
      const bucketDomains = await messageCenter.requestUpdateBucket(currentBucket)
      setBucketDomainInfo({
        bucketDomains: bucketDomains,
        selectBucketDomain: bucketDomains[0] || '',
      })
      const utoken = await messageCenter.requestGenerateUploadToken()
      setUploadToken(utoken)

      isLoadingResource = true
      // 从根目录加载，prefix 为空

      const resourceListResponse = await messageCenter.requestGetResourceList({
        fromBegin: true,
        prefix: '',
      })
      isLoadingResource = false
      setCommonPrefixList(resourceListResponse.commonPrefixes)
      setResourceList(resourceListResponse.list)
      setIsResourceListReachEnd(resourceListResponse.reachEnd)
      handleGetOverviewInfo()
    } catch (e) {
      message.error(e)
    }
    // window.addEventListener('paste', handlePaste)
    return () => {
      // window.removeEventListener('paste', handlePaste)
    }
  }, [currentBucket])

  useEffect(() => {
    renderUploadManager()
    // 1天刷新 token
    let interval = setInterval(() => {
      ensureTokenAvailable()
    }, 1000 * 3600 * 24)
    return () => {
      destroyUploadManager()
      clearInterval(interval)
    }
  }, [])

  const fetchFromUrlGeneratedKey = isUrl(fetchFromUrlTargetUrl)
    ? `${pendingUploadPrefix}${encodeURIComponent(
        generateRandomResourceName(
          fetchFromUrlTargetUrl.split('/').slice(-1)[0],
          settings.uploadUseOrignalFileName
        )
      )}`
    : ''

  return (
    <Fragment>
      <Modal
        visible={fetchFromUrlModalVisible}
        title="输入资源 url"
        width={700}
        okText="确认"
        cancelText="取消"
        onOk={() => handleComfirmFetchFromUrl(fetchFromUrlTargetUrl, fetchFromUrlGeneratedKey)}
        onCancel={() => {
          setFetchFromUrlModalVisible(false)
          setFetchFromUrlTargetUrl('')
        }}
      >
        <div>
          <Input
            type="text"
            placeholder="资源地址，必须带上协议 http 或者 https"
            value={fetchFromUrlTargetUrl}
            onPressEnter={handleComfirmFetchFromUrl}
            onChange={e => {
              setFetchFromUrlTargetUrl(e.target.value)
            }}
            onPaste={e => e.stopPropagation()}
          />
          {isUrl(fetchFromUrlTargetUrl) && (
            <div className={styles.setFetchFromUrlFinalKey}>
              最终路径：
              {fetchFromUrlGeneratedKey}
            </div>
          )}
        </div>
      </Modal>
      <PasteAndDragUpload
        currentBucket={currentBucket}
        csp={csp}
        uploadToken={uploadToken}
        resourcePrefix={resourcePrefix}
        pendingUploadPrefix={pendingUploadPrefix}
        handleSetPendingUploadPrefix={e => setPendingUploadPrefix(e.target.value)}
        resetPendingUploadPrefix={() => setPendingUploadPrefix(uploadFolders.join(''))}
      />
      <div className={styles.bucketNavWrapper}>
        <Select
          value={bucketDomainInfo.selectBucketDomain}
          style={{ width: 250 }}
          onChange={handleChangeDomain}
        >
          {bucketDomainInfo.bucketDomains.map(d => (
            <Option key={d} value={d}>
              {d}
            </Option>
          ))}
        </Select>
        <div className={styles.bucketToolsWrapper}>
          <SelectUpload
            isDirectory={false}
            multiple={true}
            csp={csp}
            uploadToken={uploadToken}
            resourcePrefix={resourcePrefix}
            pendingUploadPrefix={pendingUploadPrefix}
            handleSetPendingUploadPrefix={e => setPendingUploadPrefix(e.target.value)}
            resetPendingUploadPrefix={() => setPendingUploadPrefix(uploadFolders.join(''))}
          >
            <Button
              type="dashed"
              title="文件上传(支持多选)"
              icon={<FileOutlined style={{ fontSize: '20px' }} />}
            ></Button>
          </SelectUpload>
          <SelectUpload
            isDirectory={true}
            csp={csp}
            uploadToken={uploadToken}
            resourcePrefix={resourcePrefix}
            pendingUploadPrefix={pendingUploadPrefix}
            handleSetPendingUploadPrefix={e => setPendingUploadPrefix(e.target.value)}
            resetPendingUploadPrefix={() => setPendingUploadPrefix(uploadFolders.join(''))}
          >
            <Button
              type="dashed"
              title="文件夹上传"
              icon={<FolderOpenOutlined style={{ fontSize: '20px' }} />}
            ></Button>
          </SelectUpload>
          <Button
            onClick={() => setFetchFromUrlModalVisible(true)}
            type="dashed"
            title="url 直传文件"
            icon={<LinkOutlined style={{ fontSize: '20px' }} />}
          ></Button>
          <Button
            type="dashed"
            title="导出 folder 中所有链接"
            onClick={() => {
              let totalStr = ''
              resourceList.forEach(r => (totalStr += `${resourcePrefix + r.key}\r\n`))
              copy(totalStr)
              message.success('已复制到剪切板')
            }}
            icon={<ProfileOutlined style={{ fontSize: '20px' }} />}
          ></Button>
          <Button
            type="dashed"
            title="刷新"
            onClick={() => handleRefresh(uploadFolders)}
            icon={<SyncOutlined style={{ fontSize: '20px' }} />}
          ></Button>
        </div>
      </div>
      <div className={styles.navToolsWrapper}>
        <div className={styles.navigationWrapper}>
          {!!uploadFolders.length && [
            <HomeFilled key="tohome" onClick={handleGoToHome} className={styles.homeButton} />,
            <span key="tohomedelimiter" className={styles.delimiter}>
              /
            </span>,
          ]}
          {uploadFolders.map((_, i) => (
            <div key={i}>
              <span
                className={classnames(
                  styles.folder,
                  i === uploadFolders.length - 1 && styles.isCurrent
                )}
                onClick={() => {
                  // 导航中的最后一个不显示为可点击状态
                  // 点击之后无效
                  // 最后一个本身就指向当前的列表
                  if (i !== uploadFolders.length - 1) {
                    handleGoToTargetFolder(i, _)
                  }
                }}
              >
                {_.slice(0, -1)}
              </span>
              <span className={styles.delimiter}>/</span>
            </div>
          ))}
        </div>
        <div className={styles.bulkWrapper}>
          <div className={styles.bulkToolsWrapper}>
            {selectedKeys.length > 0 && (
              <Fragment>
                <Button size="small" onClick={handleCancelSelectAll}>
                  取消
                </Button>
                <Button size="small" onClick={handleSelectAll}>
                  全选
                </Button>
                <Button size="small">刷新缓存({selectedKeys.length})</Button>
                <Button size="small">下载({selectedKeys.length})</Button>
                <Button
                  size="small"
                  type="primary"
                  danger
                  onClick={() => {
                    Modal.confirm({
                      title: '确定删除选中的文件？',
                      icon: <ExclamationCircleOutlined />,
                      okText: '删除',
                      okType: 'danger',
                      cancelText: '取消',
                      onOk() {
                        handleDeleteSelectedFiles()
                      },
                    })
                  }}
                >
                  删除({selectedKeys.length})
                </Button>
              </Fragment>
            )}
          </div>
          <div className={styles.infoWrapper}>
            {bucketOverviewInfo.count} 个文件 / {bucketOverviewInfo.space} 存储空间
          </div>
        </div>
      </div>
      <ResourceList
        uploadFolder={uploadFolders.join('')}
        commonPrefixList={commonPrefixList}
        imagePreviewSuffix={settings.imagePreviewSuffix}
        selectedKeys={selectedKeys}
        resourceList={resourceList}
        resourcePrefix={resourcePrefix}
        handleOpenInBrowser={url =>
          messageCenter.requestOpenInBrowser(url).then(data => {
            if (data.success) {
              message.success('请在浏览器中查看')
            }
          })
        }
        handleToggleSelectKey={handleToggleSelectKey}
        handleDeleteFiles={handleDeleteFiles}
        handleSelectAll={handleSelectAll}
        handlePreviewAsImg={handlePreviewAsImg}
        // handlePreviewAsVideo={handlePreviewAsVideo}
        handleViewFolder={handleViewFolder}
        handleLoadData={() => {
          // 首次进入页面，空列表的时候自动触发
          if (resourceList.length) {
            handleLoadData()
          }
        }}
        handleBackward={handleBackward}
      />
      {/* 注意这里 display 一定要为 none，否则页面底部会出现多余的图片 */}
      <div style={{ display: 'none' }}>
        <Image.PreviewGroup
          preview={{
            visible: imgPreviewVisible,
            onVisibleChange: vis => setImgPreviewVisible(vis),
            current: imgPreviewIndex,
          }}
        >
          {resourceList.map(resourceInfo => (
            <Image key={resourceInfo.key} src={encodeURI(resourcePrefix + resourceInfo.key)} />
          ))}
        </Image.PreviewGroup>
      </div>
    </Fragment>
  )
}
