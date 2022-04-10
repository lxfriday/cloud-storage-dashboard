import React, { useEffect, useState, Fragment } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Upload, Select, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'

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
  let [searchParams] = useSearchParams()
  const currentBucket = searchParams.get('space')

  const selectFileUploadProps = {
    multiple: true,
    showUploadList: false,
    beforeUpload: () => {
      messageCenter.requestGenerateQiniuUploadToken()
      return true
    },
    customRequest(uploadInfo) {
      const { file } = uploadInfo
      const { token, key } = generateUploadImgInfo({
        token: uploadToken, //uploadToken为从后端获得的token
        file,
        folder: uploadFolder,
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

  function handleGetResourceList(event) {
    const message = event.data // The JSON data our extension sent
    if (message.command === 'getQiniuResourceList') {
      setResourceList([...resourceList, ...message.data.list])
    }
  }

  function handleChangeDomain(newDoamin) {
    setBucketDomainInfo({
      ...bucketDomainInfo,
      selectBucketDomain: newDoamin,
    })
  }

  // 接收七牛上传 token
  function handleReceiveGenerateQiniuUploadToken(event) {
    const message = event.data // The JSON data our extension sent
    if (message.command === 'generateQiniuUploadToken') {
      setUploadToken(message.data)
    }
  }
  // 接收七牛 bucket domains
  function handleReceiveGetBucketDomains(event) {
    const message = event.data // The JSON data our extension sent
    if (message.command === 'getBucketDomains') {
      setBucketDomainInfo({
        bucketDomains: message.data,
        selectBucketDomain: message.data[message.data.length - 1],
      })
      setResourceList([])
    }
  }

  useEffect(() => {
    window.addEventListener('message', handleGetResourceList)
    window.addEventListener('message', handleReceiveGenerateQiniuUploadToken)
    window.addEventListener('message', handleReceiveGetBucketDomains)

    messageCenter.requestGenerateQiniuUploadToken()

    return () => {
      window.removeEventListener('message', handleGetResourceList)
      window.removeEventListener('message', handleReceiveGenerateQiniuUploadToken)
      window.removeEventListener('message', handleReceiveGetBucketDomains)
    }
  }, [handleGetResourceList, handleReceiveGenerateQiniuUploadToken, handleReceiveGetBucketDomains])

  useEffect(() => {
    // 打开一个 bucket 的时候，更新 localside bucket
    messageCenter.requestUpdateBucket(currentBucket)
    messageCenter.requestGetQiniuResourceList()
  }, [currentBucket])

  console.log({ currentBucket, resourceList })

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
      <Button onClick={() => console.log(setResourceList([]))}>clear</Button>
      <div>{resourceList.toString()}</div>
    </Fragment>
  )
}
