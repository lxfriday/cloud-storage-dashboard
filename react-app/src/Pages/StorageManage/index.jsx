import React, { useEffect, useState, Fragment } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Select, message, Modal, Image, Input, notification, Menu, Dropdown } from 'antd'
import {
  FileOutlined,
  SyncOutlined,
  LinkOutlined,
  ProfileOutlined,
  ExclamationCircleOutlined,
  HomeFilled,
  FolderOpenOutlined,
  EllipsisOutlined,
  AppstoreOutlined,
  MenuOutlined,
} from '@ant-design/icons'
import copy from 'copy-text-to-clipboard'
import classnames from 'classnames'
import { useSelector, useDispatch } from 'react-redux'

import { downloadManager } from '../../Components/DownloadManager'
import SelectUpload from './compnents/SelectUpload'
import ResourceList from './compnents/ResourceList'
import PasteAndDragUpload from './compnents/PasteAndDragUpload'
import styles from './index.module.less'
import * as messageCenter from '../../utils/messageCenter'
import {
  getFileSize,
  isUrl,
  generateRandomResourceName,
  copyFormattedBySettings,
  getResourceExtAndName,
  getDownloadFilesInfo,
} from '../../utils'
import cloudserviceprovider from '../../utils/cloudserviceprovider'
import notiSyncBucket from '../../utils/notiSyncBucket'
import { updateBucketAction, updateListTypeAction } from '../../store/storageManage'
import messageCommands from '../../../../src/messageCommands'

const { Option } = Select

let marker = '' // 分页标记

let isSearching = false // 是否正在搜索中
// app内路由控制，解决问题：如果当前正在加载资源，突然切换文件夹的时候，前面请求的资源返回与现在的资源发生冲突
// 遵循的原则：基于用户操作，操作到哪个层级，就应该显示当前层级的内容，如果加载到的内部不属于该层级，则不显示
let routeStr = ''

function genRouteStr(bucket, pfxstr) {
  return `${bucket} => ${pfxstr}`
}

// 用于记忆加载过的页面中的数据
// 解决切换目录、bucket时候的性能瓶颈
class MemorizedBucketController {
  constructor() {
    // 如果需要更新某个目录，则直接删除对应的key，然后重建
    this.memorizedData = {
      // 'storage => patha/pathb/':
      // {
      //   dirs: [],
      //   resourceList: [],
      //   reachEnd: false,
      //   marker: '', // 分页标记点
      // },
    }
  }
  set(pathKey, data) {
    this.memorizedData[pathKey] = data
  }
  get(pathKey) {
    const memorizedData = this.memorizedData
    if (!this.has(pathKey)) {
      return { dirs: [], resourceList: [] }
    }
    return memorizedData[pathKey]
  }
  has(pathKey) {
    return !!this.memorizedData[pathKey]
  }
  delete(pathKey) {
    delete this.memorizedData[pathKey]
  }
}

const memoController = new MemorizedBucketController()

export default function StorageManage() {
  const dispatch = useDispatch()
  const settings = useSelector(state => state.settings)
  const bucketList = useSelector(state => state.storageManage.bucketList)
  const listType = useSelector(state => state.storageManage.listType)
  const csp = cloudserviceprovider[settings.currentCSP.csp]

  let [bucketDomainInfo, setBucketDomainInfo] = useState({
    bucketDomains: [],
    selectBucketDomain: '',
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
  // 选中的资源 key
  let [selectedKeys, setSelectedKeys] = useState([])

  // 选中的文件夹，todo 刷新的时候要重置
  // 带尾 /
  let [selectedFolders, setSelectedFolders] = useState([])

  let [bucketOverviewInfo, setBucketOverviewInfo] = useState({
    // currentbucket: { count: 0, space: 0 },
  })
  // 图片预览是否显示
  let [imgPreviewVisible, setImgPreviewVisible] = useState(false)
  let [imgPreviewIndex, setImgPreviewIndex] = useState(0)
  let [syncBucketFolderInfo, setSyncBucketFolderInfo] = useState({})
  let [searchValue, setSearchValue] = useState('')
  // 对应的就是取消搜索
  let [showSearchResult, setShowSearchResult] = useState(false)

  let [searchParams] = useSearchParams()
  const currentBucket = searchParams.get('space')
  const targetBucketInfo = bucketList.find(_ => _.name === currentBucket)

  /**
   * 刷新目录，回到上层目录
   */
  function handleRefresh(prefixes = [], useCacheData = true) {
    const pfxStr = prefixes.join('')
    routeStr = genRouteStr(currentBucket, pfxStr)
    const targetRouteStr = routeStr
    setSelectedKeys([])
    setSelectedFolders([])

    if (!useCacheData) memoController.delete(targetRouteStr)

    // 如果从子文件夹回到顶层文件夹，优先直接显示 syncbucketinfo 中拿到的文件夹信息，文件信息等待后续加载出来
    if (memoController.has(targetRouteStr)) {
      const memorizedData = memoController.get(targetRouteStr)
      marker = memorizedData.marker
      setUploadFolders([...prefixes])
      setPendingUploadPrefix(pfxStr)
      setCommonPrefixList(memorizedData.dirs)
      setResourceList(memorizedData.resourceList)
      setIsResourceListReachEnd(memorizedData.reachEnd)
    } else {
      messageCenter
        .requestGetResourceList(
          {
            fromBegin: true,
            prefix: pfxStr,
            marker: '',
            domain: `${settings.forceHTTPS ? 'https://' : 'http://'}${
              bucketDomainInfo.selectBucketDomain
            }`,
            isBucketPrivateRead: targetBucketInfo.isPrivateRead,
          },
          60000
        )
        .then(res => {
          if (res.success) {
            if (routeStr === targetRouteStr) {
              const { data } = res
              marker = data.marker
              setUploadFolders([...prefixes])
              setPendingUploadPrefix(pfxStr)
              setCommonPrefixList(data.commonPrefixes)
              setResourceList(data.list)
              setIsResourceListReachEnd(data.reachEnd)
              memoController.set(targetRouteStr, {
                dirs: data.commonPrefixes,
                resourceList: data.list,
                reachEnd: data.reachEnd,
                marker: data.marker,
              })
            }
          } else {
            message.error('资源列表加载失败：' + res.msg)
          }
        })
    }
  }

  // 加载列表数据，非第一页以后的调用这里
  function handleLoadData() {
    const targetRouteStr = routeStr
    if (!isResourceListReachEnd) {
      // 从根目录加载，prefix 为空
      messageCenter
        .requestGetResourceList(
          {
            fromBegin: false,
            prefix: uploadFolders.join(''),
            marker,
            domain: `${settings.forceHTTPS ? 'https://' : 'http://'}${
              bucketDomainInfo.selectBucketDomain
            }`,
            isBucketPrivateRead: targetBucketInfo.isPrivateRead,
          },
          60000
        )
        .then(res => {
          if (res.success) {
            if (routeStr === targetRouteStr) {
              const { data } = res
              marker = data.marker
              // 对已有的 commonprefixes 和新传过来的 commonprefixes 做合并，去重
              const newCommonPrefixList = [
                ...new Set([...commonPrefixList, ...data.commonPrefixes]),
              ]
              const newResourceList = [...resourceList, ...data.list]
              setCommonPrefixList(newCommonPrefixList)
              setResourceList(newResourceList)
              setIsResourceListReachEnd(data.reachEnd)
              memoController.set(targetRouteStr, {
                dirs: newCommonPrefixList,
                resourceList: newResourceList,
                reachEnd: data.reachEnd,
                marker,
              })
            }
          } else {
            message.error('资源列表加载失败：' + res.msg)
          }
        })
    }
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
    if (selectedFolders.length) {
      setSelectedFolders([])
    }
  }

  function handleToggleSelectFolder(folder) {
    let newFolder = []
    if (selectedFolders.includes(folder)) {
      for (let f of selectedFolders) {
        if (f !== folder) {
          newFolder.push(f)
        }
      }
    } else {
      newFolder = [...selectedFolders, folder]
    }

    setSelectedFolders(newFolder)
    if (selectedKeys.length) {
      setSelectedKeys([])
    }
  }

  // 取消全选
  function handleCancelSelectAll() {
    setSelectedKeys([])
  }

  // 取消选中的目录
  function handleCancelSelectAllFolders() {
    setSelectedFolders([])
  }

  // 全选
  function handleSelectAll() {
    const keys = []
    resourceList.forEach(rs => keys.push(rs.key))
    setSelectedKeys(keys)
  }

  // 删除一个和删除多个文件都走这个函数
  function handleDeleteFiles(keys) {
    messageCenter.requestDeleteBucketFiles(keys).then(res => {
      const { data } = res
      if (data === 'alldeleted') {
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
            nSelectedKeys.push(k)
          }
        })
        setSelectedKeys(nSelectedKeys)
        setResourceList(rList)
        notiSyncBucket()
      } else if (data === 'partdeleted') {
        message.error('部分文件删除成功')
        handleRefresh(uploadFolders)
      } else {
        message.error('删除失败：' + res.msg)
      }
    })
  }

  // 工具条中点击删除，删除选中的文件
  function handleDeleteSelectedFiles() {
    handleDeleteFiles(selectedKeys)
  }

  // 双击图片点击了预览，or右键点击了预览
  function handlePreviewAsImg(ind) {
    setImgPreviewIndex(ind)
    setImgPreviewVisible(true)
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
    if (isUrl(url)) {
      setTimeout(() => {
        if (!hasFinished) {
          notification.warning({
            message: '注意',
            description: '抓取的文件过大，抓取所消耗的时间会比较长',
            duration: 20,
          })
        }
      }, 5000)
      messageCenter
        .requestFetchResourceToBucket({
          url,
          key,
        })
        .then(data => {
          if (data.success) {
            copyFormattedBySettings(settings.copyFormat, encodeURI(`${resourcePrefix}${key}`))
            message.success('资源抓取成功，已复制到剪切板')
            notiSyncBucket()
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

  function handleRenameResource({ originalKey, newKey, op }) {
    messageCenter
      .requestMoveBucketFile({ originalKey, newKey })
      .then(res => {
        if (res.success) {
          message.success((op === 'move' ? '移动' : '重命名') + '文件成功')
          handleRefresh(uploadFolders)
          notiSyncBucket()
        } else {
          res.msg
            ? message.error((op === 'move' ? '移动' : '重命名') + '文件失败：' + res.msg)
            : message.error((op === 'move' ? '移动' : '重命名') + '文件失败')
        }
      })
      .catch(e => {
        message.error((op === 'move' ? '移动' : '重命名') + '文件失败')
      })
  }

  // 多选的时候
  // 对选中的文件刷新缓存，一次最多只能有100个
  function handleRefreshSelectedResources() {
    const fileUrls = selectedKeys.map(k => encodeURI(resourcePrefix + k))
    messageCenter
      .requestRefreshFiles(fileUrls)
      .then(res => {
        if (res.success) {
          const { data } = res
          data && data.leftCount
            ? message.success('文件 CDN 刷新成功，今日文件刷新限额剩余 ' + data.leftCount)
            : message.success('文件 CDN 刷新成功')
        } else {
          message.error('文件 CDN 刷新失败：' + res.msg)
        }
      })
      .catch(e => {
        message.error('文件 CDN 刷新失败')
      })
    setSelectedKeys([])
  }

  // 直接右键某个文件
  function handleRefreshResource(url) {
    messageCenter
      .requestRefreshFiles([encodeURI(url)])
      .then(res => {
        if (res.success) {
          const { data } = res
          data && data.leftCount
            ? message.success('文件 CDN 刷新成功，今日文件刷新限额剩余 ' + data.leftCount)
            : message.success('文件 CDN 刷新成功')
        } else {
          message.error('文件 CDN 刷新失败：' + res.msg)
        }
      })
      .catch(e => {
        message.error('文件 CDN 刷新失败')
      })
  }

  // 直接右键点击刷新文件夹
  function handleRefreshDir(dir) {
    const realDirPath = uploadFolders.join('') + dir
    const dirUrl = resourcePrefix + realDirPath
    messageCenter
      .requestRefreshDirs([encodeURI(dirUrl)])
      .then(res => {
        if (res.success) {
          const { data } = res
          data && data.leftCount
            ? message.success('文件夹 CDN 刷新成功，今日文件夹刷新限额剩余 ' + data.leftCount)
            : message.success('文件夹 CDN 刷新成功')
        } else {
          message.error('文件夹 CDN 刷新失败：' + res.msg)
        }
      })
      .catch(e => {
        message.error('文件夹 CDN 刷新失败')
      })
  }

  // 刷新选中的文件夹（多选的）
  function handleRefreshSelectedDir() {
    const realDirUrls = selectedFolders.map(f => resourcePrefix + uploadFolders.join('') + f)
    messageCenter
      .requestRefreshDirs(realDirUrls)
      .then(res => {
        if (res.success) {
          const { data } = res
          data && data.leftCount
            ? message.success('文件夹 CDN 刷新成功，今日文件夹刷新限额剩余 ' + data.leftCount)
            : message.success('文件夹 CDN 刷新成功')
        } else {
          message.error('文件夹 CDN 刷新失败：' + res.msg)
        }
      })
      .catch(e => {
        message.error('文件夹 CDN 刷新失败')
      })
    setSelectedFolders([])
  }

  // 单、多文件下载都走这个函数
  // filesInfo => [{ext, fname, url}, ...]
  // ext 尾缀
  // fname 纯文件名，不包含尾缀
  // url 文件地址
  function handleDownloadFiles(filesInfo) {
    // 下载前先检查文件下载目录是否指定了
    if (!settings.downloadDir.length) {
      notification.error({
        message: '注意',
        description: '请先前往 【设置】 指定【文件下载目录】，再进行文件下载操作',
        duration: 5,
      })
      return
    }
    const processedFilesInfo = getDownloadFilesInfo(filesInfo, targetBucketInfo.isPrivateRead)
    setSelectedKeys([])
    // message.info('文件下载开始')
    downloadManager(processedFilesInfo)
    messageCenter
      .requestDownloadFiles({
        filesInfo: processedFilesInfo,
        downloadDir: settings.downloadDir,
      })
      .catch(e => {
        message.error('请求下载任务失败')
      })
  }

  // 点击工具栏的下载，这是批量下载
  function handleBulkDownload() {
    const downloadFilesInfo = []
    for (const r of resourceList) {
      if (selectedKeys.includes(r.key)) {
        const keyS = r.key.split('/')
        const fileFullName = keyS[keyS.length - 1]
        downloadFilesInfo.push({
          signatureUrl: r.signatureUrl,
          url: resourcePrefix + r.key,
          ...getResourceExtAndName(fileFullName),
        })
      }
    }
    handleDownloadFiles(downloadFilesInfo)
  }

  function handleSearch() {
    if (!isSearching) {
      const keyword = searchValue.trim().toLowerCase()
      if (!keyword.length) {
        message.error('请输入内容之后再搜索')
        return
      }
      isSearching = true
      // 搜索的时候，默认直接回到最顶层目录

      messageCenter
        .requestSyncBucketSearchFile({
          keyword,
          domain: `${settings.forceHTTPS ? 'https://' : 'http://'}${
            bucketDomainInfo.selectBucketDomain
          }`,
          isBucketPrivateRead: targetBucketInfo.isPrivateRead,
        })
        .then(res => {
          if (res.success) {
            if (!res.data.length) {
              message.error('没有搜索到结果')
            } else {
              setSelectedKeys([])
              setSelectedFolders([])
              setUploadFolders([])
              setCommonPrefixList([])
              setShowSearchResult(true)
              setResourceList(res.data)
            }
          } else {
            message.error('搜索失败：' + res.msg)
          }
        })
        .finally(() => {
          isSearching = false
        })
    } else {
      message.error('正在搜索中，请稍后')
    }
  }

  function handleUpdateStorageClass({ key, storageClass, storageClassName }) {
    messageCenter
      .requestUpdateStorageClass({ key, storageClass })
      .then(res => {
        if (res.success) {
          const newList = []
          resourceList.forEach(r => {
            if (r.key === key) {
              newList.push({
                ...r,
                storageClass,
              })
            } else {
              newList.push(r)
            }
          })
          setResourceList(newList)
          message.success(`存储类型已变更为 【${storageClassName}】`)
        } else {
          message.error('变更存储类型失败：' + res.msg)
          message.error('转换失败时请先前往云服务商控制台解冻文件')
        }
      })
      .catch(e => {
        message.error('变更存储类型失败：' + e)
      })
  }

  // 生成临时链接
  function handleGenTmpLink(key, expires) {
    const domain = `${settings.forceHTTPS ? 'https://' : 'http://'}${
      bucketDomainInfo.selectBucketDomain
    }`
    messageCenter
      .requestGetSignatureUrl({
        keys: [key],
        domain,
        expires: +expires,
      })
      .then(getSignatureUrlRes => {
        if (getSignatureUrlRes.success) {
          copy(getSignatureUrlRes.data[0])
          message.success(`临时链接已复制到剪切板，有效期 ${expires} 秒`)
        } else {
          message.error(`获取临时链接失败：${getSignatureUrlRes.msg}`)
        }
      })
      .catch(e => {
        message.error(`获取临时链接失败： ${e}`)
      })
  }

  // 打开bucket 请求bucket内的数据
  useEffect(async () => {
    dispatch(updateBucketAction(currentBucket))
    // 打开一个 bucket 的时候，更新 localside bucket
    setResourceList([])
    setUploadFolders([])
    setCommonPrefixList([])
    setPendingUploadPrefix('')
    try {
      const bucketDomainsRes = await messageCenter.requestGetBucketDomains()
      if (bucketDomainsRes.success) {
        setBucketDomainInfo({
          bucketDomains: bucketDomainsRes.data,
          selectBucketDomain: bucketDomainsRes.data[0] || '',
        })
        try {
          // 从根目录加载，prefix 为空
          const targetBucket = bucketList.find(_ => _.name === currentBucket)
          routeStr = genRouteStr(currentBucket, '')
          const targetRouteStr = routeStr
          if (memoController.has(targetRouteStr)) {
            const memorizedData = memoController.get(targetRouteStr)
            marker = memorizedData.marker
            setCommonPrefixList(memorizedData.dirs)
            setResourceList(memorizedData.resourceList)
            setIsResourceListReachEnd(memorizedData.reachEnd)
          } else {
            const resourceListResponse = await messageCenter.requestGetResourceList(
              {
                fromBegin: true,
                prefix: '',
                marker: '',
                domain: `${settings.forceHTTPS ? 'https://' : 'http://'}${
                  bucketDomainsRes.data[0]
                }`,
                isBucketPrivateRead: targetBucket.isPrivateRead,
              },
              60000
            )
            if (resourceListResponse.success) {
              if (routeStr === targetRouteStr) {
                marker = resourceListResponse.data.marker
                setCommonPrefixList(resourceListResponse.data.commonPrefixes)
                setResourceList(resourceListResponse.data.list)
                setIsResourceListReachEnd(resourceListResponse.data.reachEnd)
                memoController.set(targetRouteStr, {
                  dirs: resourceListResponse.data.commonPrefixes,
                  resourceList: resourceListResponse.data.list,
                  reachEnd: resourceListResponse.data.reachEnd,
                  marker: resourceListResponse.data.marker,
                })
              }
            } else {
              message.error('资源列表获取失败：' + resourceListResponse.msg)
            }
          }
        } catch (e) {
          message.error(e)
        }
      } else {
        message.error('bucket domain 获取失败：' + bucketDomainsRes.msg)
      }
    } catch (e) {
      message.error(e)
    }
  }, [currentBucket])

  useEffect(() => {
    // 同步 bucket 文件夹信息之后，会接收的 message
    function syncBucketFolderInfoToPage(ev) {
      const msg = ev.data
      if (msg.command === messageCommands.syncBucket_folderInfo) {
        setSyncBucketFolderInfo({
          ...syncBucketFolderInfo,
          [msg.data.bucket]: msg.data.dir,
        })
        setBucketOverviewInfo({
          [currentBucket]: {
            count: msg.data.count > 100000 ? '10w+' : msg.data.count,
            space: getFileSize(msg.data.totalSize),
          },
          ...bucketOverviewInfo,
        })
      }
    }

    window.addEventListener('message', syncBucketFolderInfoToPage)
    return () => {
      window.removeEventListener('message', syncBucketFolderInfoToPage)
    }
  }, [syncBucketFolderInfo, currentBucket, bucketOverviewInfo])

  useEffect(() => {
    messageCenter.requestSyncBucket()
    isSearching = false
    return () => {
      marker = ''
      dispatch(updateBucketAction(''))
      setSearchValue('')
      setShowSearchResult(false)
      setSelectedKeys([])
      setSelectedFolders([])
    }
  }, [currentBucket])

  const fetchFromUrlGeneratedKey = isUrl(fetchFromUrlTargetUrl)
    ? `${pendingUploadPrefix}${encodeURIComponent(
        generateRandomResourceName(
          fetchFromUrlTargetUrl.split('/').slice(-1)[0],
          settings.uploadUseOrignalFileName
        )
      )}`
    : ''

  const currentBucketFolderInfo = syncBucketFolderInfo[currentBucket]
  // commonPrefixList 是请求服务端直接返回的 文件夹信息
  // realCommonPrefixList 是合并了 commonPrefixList 以及 后端同步得到的文件夹信息 之后的文件夹信息
  let realCommonPrefixList = [...commonPrefixList]
  const currentPathArr = uploadFolders // 以数组形式表示的当前路径
  if (currentBucketFolderInfo) {
    // 处于顶层目录
    if (!currentPathArr.length) {
      realCommonPrefixList = [
        ...new Set([
          ...realCommonPrefixList,
          ...currentBucketFolderInfo['_default_cloudStorageDashboardTopKey'],
        ]),
      ]
    } else {
      // 处于某一层的文件夹中的时候
      const currentPathStr = currentPathArr.join('')
      const currentPathFolders = !!currentBucketFolderInfo[currentPathStr]
        ? currentBucketFolderInfo[currentPathStr]
        : []
      realCommonPrefixList = [...new Set([...realCommonPrefixList, ...currentPathFolders])]
    }
  }

  realCommonPrefixList = showSearchResult ? [] : realCommonPrefixList

  LogR('routeStr is ', routeStr)
  LogR('memorizedData ', memoController.memorizedData)

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
        domain={`${settings.forceHTTPS ? 'https://' : 'http://'}${
          bucketDomainInfo.selectBucketDomain
        }`}
        bucketInfo={targetBucketInfo}
        currentBucket={currentBucket}
        csp={csp}
        resourcePrefix={resourcePrefix}
        pendingUploadPrefix={pendingUploadPrefix}
        handleSetPendingUploadPrefix={e => setPendingUploadPrefix(e.target.value)}
        resetPendingUploadPrefix={() => setPendingUploadPrefix(uploadFolders.join(''))}
      />
      <div className={styles.bucketNavWrapper}>
        <Select
          className={styles.domainSelector}
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
            domain={`${settings.forceHTTPS ? 'https://' : 'http://'}${
              bucketDomainInfo.selectBucketDomain
            }`}
            bucketInfo={targetBucketInfo}
            isDirectory={false}
            multiple={true}
            csp={csp}
            resourcePrefix={resourcePrefix}
            pendingUploadPrefix={pendingUploadPrefix}
            handleSetPendingUploadPrefix={e => setPendingUploadPrefix(e.target.value)}
            resetPendingUploadPrefix={() => setPendingUploadPrefix(uploadFolders.join(''))}
          >
            <Button
              title="文件上传(支持多选)"
              icon={<FileOutlined style={{ fontSize: '20px' }} />}
            ></Button>
          </SelectUpload>
          <SelectUpload
            domain={`${settings.forceHTTPS ? 'https://' : 'http://'}${
              bucketDomainInfo.selectBucketDomain
            }`}
            bucketInfo={targetBucketInfo}
            isDirectory={true}
            csp={csp}
            resourcePrefix={resourcePrefix}
            pendingUploadPrefix={pendingUploadPrefix}
            handleSetPendingUploadPrefix={e => setPendingUploadPrefix(e.target.value)}
            resetPendingUploadPrefix={() => setPendingUploadPrefix(uploadFolders.join(''))}
          >
            <Button
              title="文件夹上传"
              icon={<FolderOpenOutlined style={{ fontSize: '20px' }} />}
            ></Button>
          </SelectUpload>
          <Button
            onClick={() => setFetchFromUrlModalVisible(true)}
            title="url 直传文件"
            icon={<LinkOutlined style={{ fontSize: '20px' }} />}
          ></Button>
          <Button
            title="导出 folder 中所有链接"
            onClick={() => {
              if (!targetBucketInfo.isPrivateRead) {
                let totalStr = ''
                resourceList.forEach(r => (totalStr += `${encodeURI(resourcePrefix + r.key)}\r\n`))
                copy(totalStr)
              } else {
                const signatureUrls = []
                resourceList.forEach(_ => {
                  !!_.signatureUrl && signatureUrls.push(_.signatureUrl)
                })
                copyFormattedBySettings('url', signatureUrls)
              }
              message.success('已复制到剪切板')
            }}
            icon={<ProfileOutlined style={{ fontSize: '20px' }} />}
          ></Button>
          <Button
            title="刷新"
            onClick={() => handleRefresh(uploadFolders, false)}
            icon={<SyncOutlined style={{ fontSize: '20px' }} />}
          ></Button>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item onClick={() => messageCenter.requestSyncBucket(true)} key="forceSync">
                  强制同步本地 bucket 信息
                </Menu.Item>
              </Menu>
            }
            placement="bottom"
          >
            <Button
              title="更多操作"
              icon={<EllipsisOutlined style={{ fontSize: '20px' }} />}
            ></Button>
          </Dropdown>
          <span className={styles.searchWrapper}>
            <Input.Search
              placeholder="在这里搜索"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onSearch={handleSearch}
              onPressEnter={handleSearch}
              style={{ width: 200 }}
              onPaste={e => e.stopPropagation()}
            />
          </span>
          {showSearchResult && (
            <Button
              type="primary"
              size="small"
              danger
              onClick={() => {
                setSearchValue('')
                setResourceList([])
                setShowSearchResult(false)
                handleRefresh(uploadFolders)
              }}
            >
              取消搜索
            </Button>
          )}
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
                <Button
                  size="small"
                  type="ghost"
                  style={{ color: '#fff' }}
                  onClick={handleCancelSelectAll}
                >
                  取消
                </Button>
                <Button
                  size="small"
                  type="ghost"
                  style={{ color: '#fff' }}
                  onClick={handleSelectAll}
                >
                  全选
                </Button>
                <Button
                  size="small"
                  type="ghost"
                  style={{ color: '#fff' }}
                  onClick={handleRefreshSelectedResources}
                >
                  刷新缓存({selectedKeys.length})
                </Button>
                <Button
                  size="small"
                  type="ghost"
                  style={{ color: '#fff' }}
                  onClick={handleBulkDownload}
                >
                  下载({selectedKeys.length})
                </Button>
                <Button
                  size="small"
                  type="primary"
                  danger
                  onClick={() => {
                    if (settings.deleteWithoutConfirm) {
                      handleDeleteSelectedFiles()
                    } else {
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
                    }
                  }}
                >
                  删除({selectedKeys.length})
                </Button>
              </Fragment>
            )}
            {selectedFolders.length > 0 && (
              <Fragment>
                <Button
                  size="small"
                  type="ghost"
                  style={{ color: '#fff' }}
                  onClick={handleCancelSelectAllFolders}
                >
                  取消
                </Button>
                {/* <Button size="small" onClick={null}>
                  全选
                </Button> */}
                <Button
                  size="small"
                  type="ghost"
                  style={{ color: '#fff' }}
                  onClick={handleRefreshSelectedDir}
                >
                  刷新缓存({selectedFolders.length})
                </Button>
                {/* <Button size="small">下载({selectedFolders.length})</Button> */}
                {/* <Button
                  size="small"
                  type="primary"
                  danger
                  onClick={() => {
                    Modal.confirm({
                      title: '确定删除选中的目录？',
                      icon: <ExclamationCircleOutlined />,
                      okText: '删除',
                      okType: 'danger',
                      cancelText: '取消',
                      onOk() {
                        // handleDeleteSelectedFiles()
                      },
                    })
                  }}
                >
                  删除({selectedFolders.length})
                </Button> */}
              </Fragment>
            )}
          </div>
          <div className={styles.infoWrapper}>
            {bucketOverviewInfo[currentBucket] ? bucketOverviewInfo[currentBucket].count : '?'}{' '}
            个文件 /{' '}
            {bucketOverviewInfo[currentBucket] ? bucketOverviewInfo[currentBucket].space : '?'}{' '}
            存储空间
          </div>
          <div className={styles.changeListTypeWrapper}>
            {listType === 'list' && (
              <div
                className={styles.wrapper}
                onClick={() => dispatch(updateListTypeAction('grid'))}
                title="变更为网格列表"
              >
                <AppstoreOutlined className={styles.button} />
              </div>
            )}
            {listType === 'grid' && (
              <div
                className={styles.wrapper}
                onClick={() => dispatch(updateListTypeAction('list'))}
                title="变更为普通列表"
              >
                <MenuOutlined className={styles.button} />
              </div>
            )}
          </div>
        </div>
      </div>
      <ResourceList
        listType={listType}
        bucketInfo={targetBucketInfo}
        uploadFolder={uploadFolders.join('')}
        commonPrefixList={realCommonPrefixList}
        selectedKeys={selectedKeys}
        selectedFolders={selectedFolders}
        resourceList={resourceList}
        resourcePrefix={resourcePrefix}
        handleOpenInBrowser={url =>
          messageCenter.requestOpen(url).then(data => {
            if (data.success) {
              message.success('请在浏览器中查看')
            }
          })
        }
        handleToggleSelectKey={handleToggleSelectKey}
        handleToggleSelectFolder={handleToggleSelectFolder}
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
        handleRenameResource={handleRenameResource}
        handleRefreshResource={handleRefreshResource}
        handleRefreshDir={handleRefreshDir}
        handleDownloadFiles={handleDownloadFiles}
        handleUpdateStorageClass={handleUpdateStorageClass}
        handleGenTmpLink={handleGenTmpLink}
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
            <Image
              key={Math.random() * 100000000}
              src={
                targetBucketInfo.isPrivateRead && !!resourceInfo.signatureUrl
                  ? resourceInfo.signatureUrl
                  : encodeURI(resourcePrefix + resourceInfo.key)
              }
            />
          ))}
        </Image.PreviewGroup>
      </div>
    </Fragment>
  )
}
