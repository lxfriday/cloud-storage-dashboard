import React, { useEffect, useState, Fragment } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Upload, Select, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'

import ImgCard from './compnents/ImgCard'

import styles from './index.module.less'
import * as messageCenter from '../../utils/messageCenter'
import { generateUploadImgInfo } from '../../utils'
import cloudserviceprovider from '../../utils/cloudserviceprovider'

const { Option } = Select

const providerName = 'qiniu'
const csp = cloudserviceprovider[providerName]

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
      csp.upload({
        file,
        key,
        token,
        forceHTTPS,
        imgDomain: bucketDomainInfo.selectBucketDomain,
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
    console.log('delete file keys', keys)
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
      messageCenter.requestGetResourceList().then(data => {
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
        <div>
          <Upload {...selectFileUploadProps}>
            <Button
              type="dashed"
              title="文件上传(支持多选)"
              icon={<UploadOutlined style={{ fontSize: '20px' }} />}
            ></Button>
          </Upload>
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
              <Button size="small" type="primary" danger>
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
          />
        ))}
      </div>
    </Fragment>
  )
}
