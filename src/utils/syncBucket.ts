// 用来同步 bucket 内的文件信息
// 把 bucket 内的文件信息下载到本地，方便做所有文件夹和搜索
import * as path from 'path'
import * as vscode from 'vscode'
import { createHash } from 'crypto'
import * as fs from 'fs'
import { CSPAdaptorType } from './cspAdaptor'
import { extPath } from './boot'
import messageCommands from '../messageCommands'
import {
  resourceListItemType,
  resourceListItemWithSignatureUrlType,
  signatureUrlExpires,
} from './cspAdaptor/cspAdaptor.common'

const syncDirName = 'sync'
const syncSettingsFileName = 'syncSettings.json'
const syncDirPath = path.resolve(extPath, syncDirName)
const syncSettingsPath = path.resolve(extPath, syncSettingsFileName) // sync 配置文件地址
const maxFilesLength = 100000 // 文件信息最多存储10w条，防止存储过多出现问题

let totalSize = 0 // bucket 占用空间
let isSyncing = false
let marker = ''
const expiredTime = 1000 * 60 * 60 // 1 h => 3600 000 毫秒
// const expiredTime = 1000 // 1s => 需要新生成文件的时候使用这个值

function getSyncFileName(csp: CSPAdaptorType): { fileName: string; fullFileName: string } {
  const fileName = createHash('sha256')
    .update(`${csp.bucket} ${csp.ak} ${csp.sk} ${csp.nickname} ${csp.csp}`)
    .digest('hex')
  return { fileName, fullFileName: `${fileName}.json` }
}

export async function searchFile(
  csp: CSPAdaptorType,
  keyword: string,
  domain: string,
  isBucketPrivateRead: boolean
): Promise<{ success: boolean; data?: resourceListItemWithSignatureUrlType[]; msg?: string }> {
  try {
    const { fileName, fullFileName } = getSyncFileName(csp)
    const bucketSyncPath = path.resolve(syncDirPath, fullFileName)
    if (fs.existsSync(bucketSyncPath)) {
      const files = JSON.parse(fs.readFileSync(bucketSyncPath).toString())
      const res: resourceListItemWithSignatureUrlType[] = []

      const startTime = Date.now()
      console.log('search start')

      for (const _ of <resourceListItemType[]>files) {
        if (_.key.toLowerCase().includes(keyword)) {
          res.push({
            ..._,
            signatureUrl: '',
          })
        }
        if (res.length >= 1000) {
          break
        }
      }

      // 非私有读的bucket
      if (isBucketPrivateRead) {
        console.log('isBucketPrivateRead 是私有读的 bucket')

        const resourceListWithSignatureUrl = await Promise.all<
          Promise<resourceListItemWithSignatureUrlType>[]
        >(
          res.map(
            _ =>
              new Promise((res, rej) => {
                csp
                  .getSignatureUrl([_.key], domain, signatureUrlExpires)
                  .then(getSignatureUrlResult => {
                    if (getSignatureUrlResult.success) {
                      res({
                        ..._,
                        // @ts-ignore
                        signatureUrl: getSignatureUrlResult.data[0],
                      })
                    } else {
                      res({
                        ..._,
                        signatureUrl: '',
                      })
                    }
                  })
              })
          )
        )
        console.log('search end, cost time:', Date.now() - startTime)
        return {
          success: true,
          data: resourceListWithSignatureUrl,
        }
      } else {
        console.log('search end, cost time:', Date.now() - startTime)
        return {
          success: true,
          data: res,
        }
      }
    } else {
      return {
        success: false,
        msg: 'bucket 内文件信息统计中，请稍后再试',
      }
    }
  } catch (e) {
    return {
      success: false,
      msg: String(e),
    }
  }
}

export default function syncBucket(
  csp: CSPAdaptorType,
  postMessage: postMessageType,
  forceSync: boolean = false // 用户自己想要强制执行同步，强制执行需要忽略过期时间的限制
): Promise<{ success: boolean }> {
  return new Promise((resolve, reject) => {
    if (!isSyncing) {
      resolve({
        success: true,
      })
      totalSize = 0
      const { fileName, fullFileName } = getSyncFileName(csp)
      const bucketSyncPath = path.resolve(syncDirPath, fullFileName)
      if (!fs.existsSync(bucketSyncPath)) {
        sync(csp, marker, [], postMessage)
        // 通知前端，后端要开始同步 bucket 信息了
        postMessage({
          command: messageCommands.syncBucket_startSyncing,
          data: {
            bucket: csp.bucket,
          },
        })
      } else {
        const syncSettings = JSON.parse(fs.readFileSync(syncSettingsPath).toString())
        // 已经生成的 bucket data 过期了，需要重新同步 bucket 信息
        if (
          forceSync ||
          Date.now() -
            Number(!!syncSettings[fileName].createdTime ? syncSettings[fileName].createdTime : 0) >
            expiredTime
        ) {
          sync(csp, marker, [], postMessage)
          // 通知前端，后端要开始同步 bucket 信息了
          postMessage({
            command: messageCommands.syncBucket_startSyncing,
            data: {
              bucket: csp.bucket,
            },
          })
        } else {
          // 把 bucket 内的文件夹信息发送到前端
          postMessage({
            command: messageCommands.syncBucket_folderInfo,
            data: {
              bucket: csp.bucket,
              dir: syncSettings[fileName].dir,
              count: syncSettings[fileName].count,
              totalSize: syncSettings[fileName].totalSize,
            },
          })
        }
      }
    } else {
      resolve({
        success: false,
      })
    }
  })
}

function sync(
  csp: CSPAdaptorType,
  marker: string,
  files: resourceListItemType[],
  postMessage: postMessageType
) {
  isSyncing = true
  csp.getResourceListForSync(marker).then(res => {
    if (res.success && res.data) {
      const { data } = res
      files = [...files, ...data.list]
      if (files.length < maxFilesLength && !data.reachEnd) {
        sync(csp, data.marker, files, postMessage)
      } else {
        const dir = genBucketDir(files)
        // 获取到 dir 的每个 key 都是 set，需要处理为数组，否则无法被 JSON.stringify 处理
        const processedDir: dirType = {}
        Object.keys(dir).forEach(k => {
          processedDir[k] = [...dir[k]]
        })
        saveSyncData(csp, files, processedDir)
        isSyncing = false
        postMessage({
          command: messageCommands.syncBucket_folderInfo,
          data: {
            bucket: csp.bucket,
            dir: processedDir,
            count: files.length,
            totalSize,
          },
        })
        // bucket 同步完成，告知前端
        postMessage({
          command: messageCommands.syncBucket_endSyncing,
          data: {
            bucket: csp.bucket,
          },
        })
      }
    } else {
      isSyncing = false
      res.msg && vscode.window.showErrorMessage('本地同步出现错误：' + res.msg)
    }
  })
}

function genDir(folders: string[], bucketDir: bucketDirType) {
  for (let i = 0; i < folders.length - 1; i++) {
    const _ = folders[i]
    const pfx = folders.slice(0, i).join('/')
    const key = `${pfx}${!!pfx.length ? '/' : ''}${_}/`
    if (!bucketDir[key]) {
      bucketDir[key] = new Set()
    }
    bucketDir[key].add(`${folders[i + 1]}/`)
  }
}

function genBucketDir(files: resourceListItemType[]) {
  const cloudStorageDashboardTopKey = '_default_cloudStorageDashboardTopKey'
  let bucketDir: bucketDirType = {
    [cloudStorageDashboardTopKey]: new Set<string>(),
  }
  for (const _ of files) {
    totalSize += _.fsize
    const folders = _.key.split('/').slice(0, -1)
    if (folders.length) {
      bucketDir[cloudStorageDashboardTopKey].add(`${folders[0]}/`)
      if (folders.length > 1) {
        genDir(folders, bucketDir)
      }
    }
  }
  return bucketDir
}

function saveSyncData(csp: CSPAdaptorType, files: resourceListItemType[], dir: any) {
  const { fileName, fullFileName } = getSyncFileName(csp)
  if (!fs.existsSync(syncDirPath)) {
    fs.mkdirSync(syncDirPath)
  }
  if (!fs.existsSync(syncSettingsPath)) {
    // 不存在同步配置文件，表示第一次执行同步任务，则需要首次写入同步配置信息
    fs.writeFileSync(
      syncSettingsPath,
      JSON.stringify(
        {
          [fileName]: {
            bucket: csp.bucket,
            createdTime: Date.now(),
            dir,
            bucketDataFile: fullFileName,
            count: files.length,
            totalSize,
          },
        },
        null,
        2
      )
    )
  } else {
    // 如果存在同步配置文件，则添加对应的 bucket 同步配置信息
    const syncSettingsData = JSON.parse(fs.readFileSync(syncSettingsPath).toString())

    syncSettingsData[fileName] = {
      bucket: csp.bucket,
      createdTime: Date.now(),
      dir,
      bucketDataFile: fullFileName,
      count: files.length,
      totalSize,
    }
    fs.writeFileSync(syncSettingsPath, JSON.stringify(syncSettingsData, null, 2))
  }
  const bucketSyncPath = path.resolve(syncDirPath, fullFileName)
  fs.writeFileSync(bucketSyncPath, JSON.stringify(files))
}

type fileType = {
  fsize: number
  hash: string
  key: string
  md5: string
  mimeType: string
  putTime: number
  // folders: string[]
}

type bucketDirType = {
  [key: string]: Set<string>
}
type dirType = {
  [key: string]: string[]
}

type postMessageType = (params: any, hideLog?: boolean) => void
