import * as async from 'async'
import * as path from 'path'
import Downloader from '@lxfriday/nodejs-file-downloader'
import messageCommands from '../messageCommands'
import { throttle } from './index'

type fileInfoType = {
  id: string // 任务id
  url: string // 下载地址
  fname: string // 带时间戳区分的文件名
  originalName: string // 真实文件名
}

type wrappedFileInfoType = {
  id: string
  url: string
  fname: string
  downloader: Downloader
  originalName: string
}

type postMessageType = (params: any, hideLog?: boolean) => void

const downloadManagerArr: wrappedFileInfoType[] = []
let isDownloading = false
let current: Array<wrappedFileInfoType> = []

// 通过引用直接从队列里面删除对应的 target
function removeTarget(_: wrappedFileInfoType) {
  downloadManagerArr.splice(downloadManagerArr.indexOf(_), 1)
}

// 通过 id 获取到指定的 target
function getTarget(id: string) {
  for (const _ of current) {
    if (_.id === id) return _
  }
  for (const _ of downloadManagerArr) {
    if (_.id === id) return _
  }
  return null
}

export function onReceiveCancelMessage(id: string, postMessage: postMessageType) {
  const target = getTarget(id)

  if (target) {
    try {
      // 调用 cancel，如果是正在下载中的，则不会报错，并且取消下载
      // 如果是在排队的，则会抛出异常，直接从队列里面删除掉即可
      target.downloader.cancel()
      postMessage({
        command: messageCommands.downloadManager_cancel,
        data: { id },
      })
    } catch (e) {
      postMessage({
        command: messageCommands.downloadManager_cancel,
        data: { id },
      })
      removeTarget(target)
    }
  }
}

function download(postMessage: postMessageType) {
  // 兼容多任务下载，暂时不改成单文件的形式
  // 但是实际是单文件一条一条地下载
  current = <Array<wrappedFileInfoType>>[downloadManagerArr.shift()].filter(Boolean)
  async
    .mapLimit<wrappedFileInfoType, wrappedFileInfoType>(current, 1, (_, cb) => {
      global.__DEV__ && console.log('[download manger][start] => ' + _.id)
      _.downloader
        .download()
        .then(() => {
          global.__DEV__ && console.log('[download manger][finished] => ' + _.id)
          cb()
        })
        .catch(e => {
          if (e.code === 'ERR_REQUEST_CANCELLED') {
            global.__DEV__ && console.log('[download manger][cancelled] => ' + _.id)
            cb()
          } else {
            // 下载失败了，把下载失败的 id 传递到后面的逻辑去
            global.__DEV__ && console.log('[download manger][failed] => ' + _.id)
            console.log('下载失败', _.fname, String(e))
            postMessage({
              command: messageCommands.downloadManager_error,
              data: {
                id: _.id,
                originalName: _.originalName,
                errMsg: String(e),
              },
            })
            cb(null, _)
          }
        })
    })
    .then(_ => {
      current = []
      const failedFiles = _.filter(Boolean)
      if (failedFiles.length) {
        global.__DEV__ && console.log('failedFiles', failedFiles)
      }
      if (downloadManagerArr.length) {
        download(postMessage)
      } else {
        global.__DEV__ && console.log('下载任务完成', downloadManagerArr)
        isDownloading = false
      }
    })
}

export function manager(
  filesInfo: fileInfoType[],
  directory: string,
  postMessage: postMessageType
) {
  function onProgress(id: string, percentage: string) {
    postMessage(
      {
        command: messageCommands.downloadManager_progress,
        data: {
          id,
          percentage,
        },
      },
      true
    )
  }
  // 防止 onProgress 触发太多次，导致下载失败，是的你没有看错，onProgress 触发太平凡，postMessage 调用次数太频繁而导致的下载失败
  const throttleOnProgress = throttle(onProgress, 1000)

  const dir = path.resolve(directory)
  filesInfo.map(_ => {
    const downloader = new Downloader({
      url: _.url,
      directory: dir,
      fileName: _.fname,
      onProgress: percentage => {
        if (Number(percentage) === 100) {
          onProgress(_.id, percentage)
        } else {
          throttleOnProgress(_.id, percentage)
        }
      },
      headers: {
        // fake ua
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
      },
    })
    const newFileInfo = {
      ..._,
      downloader,
    }
    downloadManagerArr.push(newFileInfo)
    return newFileInfo
  })
  if (!isDownloading) {
    isDownloading = true
    download(postMessage)
  }
}
