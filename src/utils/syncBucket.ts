// 用来同步 bucket 内的文件信息
// 把 bucket 内的文件信息下载到本地，方便做所有文件夹和搜索
import * as path from 'path'
import * as fs from 'fs'
import { CSPAdaptorType } from './cspAdaptor'
import { extPath } from './boot'
import messageCommands from '../messageCommands'

const syncDirName = 'sync'
const syncDirPath = path.resolve(extPath, syncDirName)
const maxFilesLength = 100000 // 文件信息最多存储10w条，防止存储过多出现问题

let isSyncing = false
let marker = ''
const expiredTime = 1000 * 60 * 60 // 1 h => 3600 000 毫秒
// const expiredTime = 1000 // 1s => 需要新生成文件的时候使用这个值

export function searchFile(
  csp: CSPAdaptorType,
  keyword: string
): { success: boolean; data: fileType[]; msg: string } {
  const bucketSyncPath = path.resolve(syncDirPath, `${csp.bucket}.json`)
  if (fs.existsSync(bucketSyncPath)) {
    const { files } = JSON.parse(fs.readFileSync(bucketSyncPath).toString())
    const res: fileType[] = []

    const startTime = Date.now()
    console.log('search start')

    for (const _ of <fileType[]>files) {
      if (_.key.toLowerCase().includes(keyword)) {
        res.push(_)
      }
      if (res.length >= 1000) {
        break
      }
    }
    console.log('search end, cost time:', Date.now() - startTime)
    return {
      success: true,
      data: res,
      msg: '',
    }
  } else {
    console.log('没有本地同步文件，取消搜索')
    return {
      success: false,
      msg: 'bucket 内文件信息统计中，请稍后再试',
      data: [],
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
      const bucketSyncPath = path.resolve(syncDirPath, `${csp.bucket}.json`)
      if (!fs.existsSync(bucketSyncPath)) {
        console.log('没有本地同步文件，开始同步 bucket 信息', bucketSyncPath)
        sync(csp, marker, [], postMessage)
        // 通知前端，后端要开始同步 bucket 信息了
        postMessage({
          command: messageCommands.syncBucket_startSyncing,
          data: {
            bucket: csp.bucket,
          },
        })
      } else {
        const bucketData = JSON.parse(fs.readFileSync(bucketSyncPath).toString())
        // 已经生成的 bucket data 过期了，需要重新同步 bucket 信息
        if (
          forceSync ||
          (!forceSync &&
            typeof bucketData.createdTime === 'number' &&
            Date.now() - bucketData.createdTime > expiredTime)
        ) {
          console.log(
            '有本地同步文件，但是过期了（或者强制同步），开始同步 bucket 信息',
            bucketSyncPath
          )
          sync(csp, marker, [], postMessage)
          // 通知前端，后端要开始同步 bucket 信息了
          postMessage({
            command: messageCommands.syncBucket_startSyncing,
            data: {
              bucket: csp.bucket,
            },
          })
        } else {
          console.log('不会执行同步的', bucketSyncPath, bucketData.createdTime)
          // 把 bucket 内的文件夹信息发送到前端
          postMessage({
            command: messageCommands.syncBucket_folderInfo,
            data: {
              bucket: csp.bucket,
              dir: bucketData.dir,
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
  files: fileType[],
  postMessage: postMessageType
) {
  isSyncing = true
  csp.getResourceListForSync(marker).then(res => {
    files = [...files, ...res.list]
    if (files.length < maxFilesLength && !res.reachEnd) {
      sync(csp, res.marker, files, postMessage)
    } else {
      const dir = genBucketDir(files)
      // 获取到 dir 的每个 key 都是 set，需要处理为数组，否则无法被 JSON.stringify 处理
      const processedDir: dirType = {}
      Object.keys(dir).forEach(k => {
        processedDir[k] = [...dir[k]]
      })
      saveSyncData(csp.bucket, files, processedDir)
      isSyncing = false
      postMessage({
        command: messageCommands.syncBucket_folderInfo,
        data: {
          bucket: csp.bucket,
          dir: processedDir,
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

function genBucketDir(files: fileType[]) {
  const cloudStorageDashboardTopKey = '_default_cloudStorageDashboardTopKey'
  let bucketDir: bucketDirType = {
    [cloudStorageDashboardTopKey]: new Set<string>(),
  }
  files.forEach(_ => {
    const folders = _.key.split('/').slice(0, -1)
    if (folders.length) {
      bucketDir[cloudStorageDashboardTopKey].add(`${folders[0]}/`)
      if (folders.length > 1) {
        genDir(folders, bucketDir)
      }
    }
  })
  return bucketDir
}

function saveSyncData(bucket: string, files: fileType[], dir: any) {
  if (!fs.existsSync(syncDirPath)) {
    fs.mkdirSync(syncDirPath)
  }
  const bucketSyncPath = path.resolve(syncDirPath, `${bucket}.json`)
  console.log('dir', dir)
  fs.writeFileSync(bucketSyncPath, JSON.stringify({ dir, files, createdTime: Date.now() }))
}

type fileType = {
  fsize: number
  hash: string
  key: string
  md5: string
  mimeType: string
  putTime: number
  folders: string[]
}

type bucketDirType = {
  [key: string]: Set<string>
}
type dirType = {
  [key: string]: string[]
}

type postMessageType = (params: any, hideLog?: boolean) => void
