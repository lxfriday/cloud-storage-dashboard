import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import styles from './index.module.less'
import * as messageCenter from '../../utils/messageCenter'

export default function StorageManage() {
  let [resourceList, setResourceList] = useState([])
  let [searchParams] = useSearchParams()
  const currentBucket = searchParams.get('space')

  function getResourceList(event) {
    const message = event.data // The JSON data our extension sent
    if (message.command === 'getQiniuResourceList') {
      setResourceList([...resourceList, ...message.data.list])
    }
  }

  useEffect(() => {
    // 打开一个 bucket 的时候，更新 localside bucket
    messageCenter.requestUpdateBucket(currentBucket)
    window.addEventListener('message', getResourceList)
    // 请求 bucket 列表中的数据
    messageCenter.requestGetQiniuResourceList()

    return () => {
      window.removeEventListener('message', getResourceList)
    }
  }, [currentBucket])

  // console.log('resourceList', resourceList)

  return <div className={styles.wrapper}>StorageManage {currentBucket}</div>
}
