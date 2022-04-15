import React, { useEffect, useState, Fragment } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Upload, Select, message, Modal, Image } from 'antd'
import {
  UploadOutlined,
  SyncOutlined,
  LinkOutlined,
  ProfileOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import copy from 'copy-text-to-clipboard'

import ResourceList from './compnents/ResourceList'
// import videoPlayer from '../../Components/VideoPlayer'
import { renderUploadManager, destroyUploadManager } from '../../Components/UploadManager'

import styles from './index.module.less'
import * as messageCenter from '../../utils/messageCenter'
import { generateUploadImgInfo, debounce, getFileSize } from '../../utils'
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

  let [uploadToken, setUploadToken] = useState('')
  // 选中的资源 key
  let [selectedKeys, setSelectedKeys] = useState([])
  let [bucketOverviewInfo, setBucketOverviewInfo] = useState({ count: 0, space: 0 })
  // 图片预览是否显示
  let [imgPreviewVisible, setImgPreviewVisible] = useState(false)
  let [imgPreviewIndex, setImgPreviewIndex] = useState(0)

  let [searchParams] = useSearchParams()
  const currentBucket = searchParams.get('space')

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
        setCommonPrefixList(data.commonPrefixes)
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
        folder: uploadFolders.join(''),
        remainFileName: settings.uploadUseOrignalFileName,
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
          debouncedHandleRefresh(uploadFolders)
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

  useEffect(() => {
    // 打开一个 bucket 的时候，更新 localside bucket
    setResourceList([])
    setUploadFolders([])
    setCommonPrefixList([])

    messageCenter.requestUpdateBucket(currentBucket).then(data => {
      setBucketDomainInfo({
        bucketDomains: data,
        selectBucketDomain: data[data.length - 1],
      })
      messageCenter.requestGenerateUploadToken().then(data => {
        setUploadToken(data)
      })
      isLoadingResource = true
      // 从根目录加载，prefix 为空
      messageCenter.requestGetResourceList({ fromBegin: true, prefix: '' }).then(data => {
        isLoadingResource = false
        setCommonPrefixList(data.commonPrefixes)
        setResourceList(data.list)
        setIsResourceListReachEnd(data.reachEnd)
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
            onClick={() => handleRefresh(uploadFolders)}
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
        uploadFolder={uploadFolders.join('')}
        commonPrefixList={commonPrefixList}
        imagePreviewSuffix={settings.imagePreviewSuffix}
        selectedKeys={selectedKeys}
        resourceList={resourceList}
        resourcePrefix={resourcePrefix}
        handleOpenInBrowser={url => messageCenter.requestOpenInBrowser(url)}
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
            <Image key={resourceInfo.key} src={encodeURI(resourcePrefix + resourceInfo.key)} />
          ))}
        </Image.PreviewGroup>
      </div>
    </Fragment>
  )
}
