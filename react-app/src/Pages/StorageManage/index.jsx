import React, { useEffect, useState, Fragment } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Upload, Select, message, Modal, notification } from 'antd'
import {
  UploadOutlined,
  SyncOutlined,
  LinkOutlined,
  ProfileOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import copy from 'copy-text-to-clipboard'

import ImgCard from './compnents/ImgCard'

import styles from './index.module.less'
import * as messageCenter from '../../utils/messageCenter'
import { generateUploadImgInfo, debounce } from '../../utils'
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

export default function StorageManage() {
  const forceHTTPS = true

  let [bucketDomainInfo, setBucketDomainInfo] = useState({
    bucketDomains: [],
    selectBucketDomain: '',
  })
  let [uploadFolder, setUploadFolder] = useState('testfolder/')
  let [resourceList, setResourceList] = useState([])
  let [uploadToken, setUploadToken] = useState('')
  // 选中的资源 key
  let [selectedKeys, setSelectedKeys] = useState([])

  let [searchParams] = useSearchParams()
  const currentBucket = searchParams.get('space')

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
          forceHTTPS,
          imgDomain: bucketDomainInfo.selectBucketDomain,
        })
        .then(() => {
          // 上传成功之后自动刷新？
          handleRefresh()
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

  function handleRefresh() {
    // 刷新列表
    // 刷新文件数量，存储空间
    messageCenter.requestGetResourceList({ fromBegin: true, prefix: uploadFolder }).then(data => {
      setResourceList(data.list)
    })
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
      messageCenter.requestGetResourceList({ fromBegin: true, prefix: uploadFolder }).then(data => {
        setResourceList(data.list)
      })
    })
  }, [currentBucket])

  // console.log({ currentBucket, resourceList })

  const imgPrefix = `${forceHTTPS ? 'https://' : 'http://'}${bucketDomainInfo.selectBucketDomain}/`

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
              resourceList.forEach(imgInfo => (totalStr += `${imgPrefix + imgInfo.key}\r\n`))
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
        <div className={styles.infoWrapper}>10086 个文件 / 50G 存储空间</div>
      </div>
      <div className={styles.imgListWrapper}>
        {resourceList.map(imgInfo => (
          <ImgCard
            key={imgInfo.key}
            fkey={imgInfo.key}
            fsize={imgInfo.fsize}
            hash={imgInfo.hash}
            mimeType={imgInfo.mimeType}
            putTime={imgInfo.putTime}
            url={imgPrefix + imgInfo.key}
            selected={selectedKeys.includes(imgInfo.key)}
            handleToggleSelectKey={handleToggleSelectKey}
            handleDeleteFile={handleDeleteFiles}
            handleSelectAll={handleSelectAll}
            debouncedHttpsErrorNotiWarning={debouncedHttpsErrorNotiWarning}
            debouncedHttpErrorNotiError={debouncedHttpErrorNotiError}
          />
        ))}
      </div>
    </Fragment>
  )
}
