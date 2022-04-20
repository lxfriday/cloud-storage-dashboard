import MESSAGE_COMMANDS from '../../../src/messageCommands'
import messageAdaptor from './messageAdaptor'

export const providerInfo = {
  providerName: 'qiniu',
}

export function requestGenerateUploadToken() {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.generateUploadToken,
      data: {
        ...providerInfo,
      },
    },
    false
  )
}

export function requestGetResourceList(params = { fromBegin: true, prefix: '' }) {
  return messageAdaptor({
    serverCommand: MESSAGE_COMMANDS.getResourceList,
    data: {
      ...providerInfo,
      ...params,
    },
  })
}

export function requestGetBucketList() {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.getBucketList,
      data: {
        ...providerInfo,
      },
    },
    false
  )
}

export function requestUpdateBucket(newBucket) {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.updateBucket,
      data: {
        ...providerInfo,
        newBucket,
      },
    },
    false
  )
}
// 删除一个或多个文件都走这个接口
export function requestDeleteBucketFiles(keysList) {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.deleteBucketFiles,
      data: {
        ...providerInfo,
        keysList,
      },
    },
    false
  )
}

// 移动或者重命名资源，都走这个接口
export function requestMoveBucketFiles(keysInfoList) {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.moveBucketFiles,
      data: {
        ...providerInfo,
        keysInfoList,
      },
    },
    false
  )
}

export function requestGetOverviewInfo() {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.getOverviewInfo,
      data: {
        ...providerInfo,
      },
    },
    false
  )
}

export function requestOpenInBrowser(url) {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.openInBrowser,
      data: {
        ...providerInfo,
        url,
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

// 让 node 端上传文件
export function requestServerUploadFiles(params) {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.serverUploadFiles,
      data: {
        ...providerInfo,
        ...params,
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
        ...providerInfo,
        ...params,
      },
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
        ...providerInfo,
        fileUrls,
      },
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
        ...providerInfo,
        dirUrls,
      },
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
        ...providerInfo,
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
      data: {
        ...providerInfo,
      },
    },
    true
  )
}

export function requestUpdateSettings(newSettings) {
  return messageAdaptor(
    {
      serverCommand: MESSAGE_COMMANDS.updateSettings,
      data: {
        ...providerInfo,
        newSettings,
      },
    },
    false
  )
}
