import React, { useEffect, useState, Fragment } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Upload, Select, message, Modal, notification, Image } from 'antd'
import {
  UploadOutlined,
  SyncOutlined,
  LinkOutlined,
  ProfileOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import copy from 'copy-text-to-clipboard'

import ResourceList from './compnents/ResourceList'
import videoPlayer from '../../Components/VideoPlayer'
import { renderUploadManager, destroyUploadManager } from '../../Components/UploadManager'

import styles from './index.module.less'
import * as messageCenter from '../../utils/messageCenter'
import {
  generateUploadImgInfo,
  debounce,
  getFileSize,
  isImage as isImageFunc,
  isVideo as isVideoFunc,
} from '../../utils'
import cloudserviceprovider from '../../utils/cloudserviceprovider'

const { Option } = Select

const providerName = 'qiniu'
const csp = cloudserviceprovider[providerName]

// https 协议加载图片失败，自动切换到 http 协议提醒

function httpsErrorNotiWarning() {
  notification.warning({
    message: '提示',
    description: 'https 协议加载图片失败，自动切换到 http 协议加载资源',
  })
}
function httpErrorNotiError() {
  notification.error({
    message: '提示',
    description: 'http 协议加载图片也失败了',
  })
}

const debouncedHttpsErrorNotiWarning = debounce(httpsErrorNotiWarning, 3000, true)
const debouncedHttpErrorNotiError = debounce(httpErrorNotiError, 3000, true)

const forceHTTPSFromSettings = true
let isLoadingResource = false // 是否正在加载资源

export default function StorageManage() {
  let [forceHTTPS, setForceHTTPS] = useState(forceHTTPSFromSettings)
  let [bucketDomainInfo, setBucketDomainInfo] = useState({
    bucketDomains: [],
    selectBucketDomain: '',
    resourcePrefix: '',
  })
  const resourcePrefix = `${forceHTTPS ? 'https://' : 'http://'}${
    bucketDomainInfo.selectBucketDomain
  }/`
  let [uploadFolder, setUploadFolder] = useState('testfolder/')
  let [resourceList, setResourceList] = useState([])
  // 是否已经加载到最后一页了，加载完了没？
  let [isResourceListReachEnd, setIsResourceListReachEnd] = useState(false)

  let [uploadToken, setUploadToken] = useState('')
  // 选中的资源 key
  let [selectedKeys, setSelectedKeys] = useState([])
  let [bucketOverviewInfo, setBucketOverviewInfo] = useState({ count: 0, space: 0 })
  // 图片预览是否显示
  let [imgPreviewVisible, setImgPreviewVisible] = useState(false)
  let [imgPreviewIndex, setImgPreviewIndex] = useState(0)

  let [searchParams] = useSearchParams()
  const currentBucket = searchParams.get('space')

  function handleRefresh() {
    // 刷新列表
    // 刷新文件数量，存储空间
    if (!isLoadingResource) {
      isLoadingResource = true
      messageCenter.requestGetResourceList({ fromBegin: true, prefix: uploadFolder }).then(data => {
        isLoadingResource = false
        setForceHTTPS(forceHTTPSFromSettings)
        setResourceList(data.list)
        setIsResourceListReachEnd(data.reachEnd)
      })
      handleGetOverviewInfo()
    }
  }

  // 加载列表数据，非第一页以后的调用这里
  function handleLoadData() {
    console.log('StorageManage handleLoadData', {
      isResourceListReachEnd,
      isLoadingResource,
    })
    if (!isResourceListReachEnd && !isLoadingResource) {
      isLoadingResource = true
      messageCenter.requestGetResourceList({ prefix: uploadFolder }).then(data => {
        isLoadingResource = false
        setResourceList([...resourceList, ...data.list])
        setIsResourceListReachEnd(data.reachEnd)
      })
    }
  }

  const debouncedHandleRefresh = debounce(handleRefresh, 2000, false)

  const selectFileUploadProps = {
    multiple: true,
    showUploadList: false,
    beforeUpload: () => {
      messageCenter.requestGenerateUploadToken()
      return true
    },
    customRequest(uploadInfo) {
      const { file } = uploadInfo
      const { token, key } = generateUploadImgInfo({
        token: uploadToken, //uploadToken为从后端获得的token
        file,
        folder: uploadFolder,
        remainFileName: true,
      })
      csp
        .upload({
          file,
          key,
          token,
          resourcePrefix,
        })
        .then(() => {
          // 上传成功之后自动刷新？
          debouncedHandleRefresh()
        })
    },
  }

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
      console.log('requestDeleteBucketFiles', data)
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
        handleRefresh()
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
  function handlePreviewAsVideo(url) {
    videoPlayer.show(url)
  }

  useEffect(() => {
    // 打开一个 bucket 的时候，更新 localside bucket
    messageCenter.requestUpdateBucket(currentBucket).then(data => {
      setBucketDomainInfo({
        bucketDomains: data,
        selectBucketDomain: data[data.length - 1],
      })
      setResourceList([])
      messageCenter.requestGenerateUploadToken().then(data => {
        setUploadToken(data)
      })
      isLoadingResource = true
      messageCenter.requestGetResourceList({ fromBegin: true, prefix: uploadFolder }).then(data => {
        isLoadingResource = false
        setResourceList(data.list)
        setIsResourceListReachEnd(data.reachEnd)
        setForceHTTPS(forceHTTPSFromSettings)
      })
      handleGetOverviewInfo()
    })
  }, [currentBucket])

  useEffect(() => {
    renderUploadManager()
    return () => {
      destroyUploadManager()
    }
  }, [])

  return (
    <Fragment>
      <div className={styles.nav}>
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
        <div className={styles.navToolsWrapper}>
          <Upload {...selectFileUploadProps}>
            <Button
              type="dashed"
              title="文件上传(支持多选)"
              icon={<UploadOutlined style={{ fontSize: '20px' }} />}
            ></Button>
          </Upload>
          <Button
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
            onClick={handleRefresh}
            icon={<SyncOutlined style={{ fontSize: '20px' }} />}
          ></Button>
        </div>
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
      <ResourceList
        selectedKeys={selectedKeys}
        resourceList={resourceList}
        resourcePrefix={resourcePrefix}
        handleToggleSelectKey={handleToggleSelectKey}
        handleDeleteFiles={handleDeleteFiles}
        handleSelectAll={handleSelectAll}
        handlePreviewAsImg={handlePreviewAsImg}
        handlePreviewAsVideo={handlePreviewAsVideo}
        handleDisableableHTTPS={() => {
          setForceHTTPS(false)
        }}
        loadData={handleLoadData}
      />
      {/* <div className={styles.resourceListWrapper}>
        {resourceList.map((resourceInfo, ind) => (
          <ResourceCard
            isVideo={isVideoFunc(resourceInfo.mimeType.split('/')[1])}
            isImage={isImageFunc(resourceInfo.mimeType.split('/')[1])}
            key={resourceInfo.key}
            fkey={resourceInfo.key}
            fsize={resourceInfo.fsize}
            hash={resourceInfo.hash}
            mimeType={resourceInfo.mimeType}
            putTime={resourceInfo.putTime}
            url={resourcePrefix + resourceInfo.key}
            selected={selectedKeys.includes(resourceInfo.key)}
            handleToggleSelectKey={handleToggleSelectKey}
            handleDeleteFile={handleDeleteFiles}
            handleSelectAll={handleSelectAll}
            debouncedHttpsErrorNotiWarning={debouncedHttpsErrorNotiWarning}
            debouncedHttpErrorNotiError={debouncedHttpErrorNotiError}
            handlePreviewAsImg={() => handlePreviewAsImg(ind)}
            handlePreviewAsVideo={() => handlePreviewAsVideo(resourcePrefix + resourceInfo.key)}
            handleDisableableHTTPS={() => {
              setForceHTTPS(false)
            }}
          />
        ))}
      </div> */}
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
            <Image key={resourceInfo.key} src={resourcePrefix + resourceInfo.key} />
          ))}
        </Image.PreviewGroup>
      </div>
    </Fragment>
  )
}
