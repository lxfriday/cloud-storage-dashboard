import MESSAGE_COMMANDS from '../../../src/messageCommands'
import messageAdaptor from './messageAdaptor'
import { store } from '../store'

function getCSPInfo() {
  const {
    settings: { currentCSP },
    storageManage,
  } = store.getState()
  let _ = !!currentCSP ? currentCSP : {}
  return {
    ..._,
    bucket: storageManage.selectBucketInfo.name,
    region: storageManage.selectBucketInfo.region,
  }
}

export function requestGenerateUploadToken() {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.generateUploadToken,
      data: {},
      cspInfo: getCSPInfo(),
    },
    false
  )
}

export function requestGetResourceList(params, timeout = 10000) {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.getResourceList,
      data: {
        ...params,
      },
      cspInfo: getCSPInfo(),
    },
    true,
    timeout
  )
}

export function requestGetSignatureUrl(params) {
  return messageAdaptor({
    serverCommand: MESSAGE_COMMANDS.getSignatureUrl,
    data: {
      expires: 3600, // 过期时间
      ...params,
    },
    cspInfo: getCSPInfo(),
  })
}

export function requestGetBucketList() {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.getBucketList,
      data: {},
      cspInfo: getCSPInfo(),
    },
    true,
    20000
  )
}

export function requestGetBucketDomains() {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.getBucketDomains,
      data: {},
      cspInfo: getCSPInfo(),
    },
    false
  )
}
export function requestGetBucketCORS(bucket, region) {
  const {
    settings: { currentCSP },
  } = store.getState()
  let _ = !!currentCSP ? currentCSP : {}
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.getBucketCORS,
      data: {},
      cspInfo: {
        ..._,
        bucket,
        region,
      },
    },
    true
  )
}
export function requestPutBucketCORS({ bucket, region, rules }) {
  const {
    settings: { currentCSP },
  } = store.getState()
  let _ = !!currentCSP ? currentCSP : {}
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.putBucketCORS,
      data: { rules },
      cspInfo: {
        ..._,
        bucket,
        region,
      },
    },
    true
  )
}
// 删除一个或多个文件都走这个接口
export function requestDeleteBucketFiles(keysList) {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.deleteBucketFiles,
      data: {
        keysList,
      },
      cspInfo: getCSPInfo(),
    },
    false
  )
}

// 变更存储类型
export function requestUpdateStorageClass(params) {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.updateStorageClass,
      data: params,
      cspInfo: getCSPInfo(),
    },
    false
  )
}

// 移动或者重命名资源，都走这个接口
export function requestMoveBucketFile(keysInfo) {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.moveBucketFile,
      data: {
        keysInfo,
      },
      cspInfo: getCSPInfo(),
    },
    false
  )
}

export function requestGetOverviewInfo() {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.getOverviewInfo,
      data: {},
      cspInfo: getCSPInfo(),
    },
    false
  )
}

export function requestOpen(target) {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.open,
      data: {
        target,
      },
    },
    false
  )
}

// 读取文件or文件夹的信息
export function requestReadPaths(paths) {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.readPaths,
      data: {
        paths,
      },
    },
    false
  )
}

// 从网络中拉取资源到 bucket
export function requestFetchResourceToBucket(params) {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.fetchResourceToBucket,
      data: {
        ...params,
      },
      cspInfo: getCSPInfo(),
    },
    false,
    // 等待时间为 1小时
    1000 * 3600
  )
}

// CDN 操作 => 刷新文件
export function requestRefreshFiles(fileUrls) {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.refreshFiles,
      data: {
        fileUrls,
      },
      cspInfo: getCSPInfo(),
    },
    false
  )
}

// CDN 操作 => 刷新文件夹
export function requestRefreshDirs(dirUrls) {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.refreshDirs,
      data: {
        dirUrls,
      },
      cspInfo: getCSPInfo(),
    },
    false
  )
}

// 文件、文件夹选择器
// ref https://code.visualstudio.com/api/references/vscode-api#OpenDialogOptions
// ref https://code.visualstudio.com/api/references/vscode-api#vscode.window.showOpenDialog
export function requestShowOpenDialog(params = {}) {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.showOpenDialog,
      data: {
        ...params,
      },
    },
    false,
    1000 * 3600
  )
}

export function requestGetSettings() {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.getSettings,
      data: {},
    },
    false
  )
}

export function requestUpdateSettings(newSettings) {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.updateSettings,
      data: {
        newSettings,
      },
    },
    false
  )
}

export function requestResetSettings() {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.resetSettings,
      data: {},
    },
    false
  )
}

export function requestLogin(info) {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.login,
      data: {
        ...info,
      },
      cspInfo: {
        ...getCSPInfo(),
        ...info,
      },
    },
    false
  )
}

export function requestDeleteUsedCSP(info) {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.deleteUsedCSP,
      data: {
        ...info,
      },
    },
    false
  )
}

export function requestDownloadFiles({ filesInfo, downloadDir }) {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.downloadFiles,
      data: {
        filesInfo,
        downloadDir,
      },
    },
    false
  )
}

export function requestCancelDownload(id) {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.downloadManager_cancel,
      data: {
        id,
      },
    },
    false
  )
}

// forceSync => boolean 是否忽略过期时间强制执行同步
export function requestSyncBucket(forceSync) {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.syncBucket,
      data: {
        forceSync: !!forceSync,
      },
      cspInfo: getCSPInfo(),
    },
    false
  )
}

export function requestSyncBucketSearchFile(params) {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.syncBucket_searchFile,
      data: params,
      cspInfo: getCSPInfo(),
    },
    true,
    20000
  )
}
