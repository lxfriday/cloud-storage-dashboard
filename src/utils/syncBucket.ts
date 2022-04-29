// 用来同步 bucket 内的文件信息
// 把 bucket 内的文件信息下载到本地，方便做所有文件夹和搜索
import * as path from 'path'
import * as fs from 'fs'
import { CSPAdaptorType } from './cspAdaptor'
import { extPath } from './boot'

const syncDirName = 'sync'
const syncDirPath = path.resolve(extPath, syncDirName)

let isSyncing = false
let marker = ''
const expiredTime = 1000 * 60 * 60 // 1 h => 3600 000 毫秒
// const expiredTime = 1000 // 1 h => 3600 000 毫秒

export function search(
  csp: CSPAdaptorType,
  keyword: string
): { success: boolean; data: fileType[]; msg: string } {
  const bucketSyncPath = path.resolve(syncDirPath, `${csp.bucket}.json`)
  if (fs.existsSync(bucketSyncPath)) {
    const { files } = JSON.parse(fs.readFileSync(bucketSyncPath).toString())
    const res: fileType[] = []

    ;(<fileType[]>files).forEach(_ => {
      if (_.key.includes(keyword)) {
        res.push(_)
      }
    })
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

export default function syncBucket(csp: CSPAdaptorType) {
  if (!isSyncing) {
    const bucketSyncPath = path.resolve(syncDirPath, `${csp.bucket}.json`)
    if (!fs.existsSync(bucketSyncPath)) {
      console.log('没有本地同步文件', bucketSyncPath)
      sync(csp, marker, [])
    } else {
      const bucketData = JSON.parse(fs.readFileSync(bucketSyncPath).toString())
      if (
        typeof bucketData.createdTime === 'number' &&
        Date.now() - bucketData.createdTime > expiredTime
      ) {
        console.log('有本地同步文件，但是过期了', bucketSyncPath)
        sync(csp, marker, [])
      } else {
        console.log('不会执行同步的', bucketSyncPath, bucketData.createdTime)
        // ...
      }
    }
  }
}

function sync(csp: CSPAdaptorType, marker: string, files: fileType[]) {
  isSyncing = true
  csp.getResourceListForSync(marker).then(res => {
    files = [
      ...files,
      ...res.list,
      // ...res.list.map(_ => ({
      //   ..._,
      //   folders: _.key.split('/').slice(0, -1),
      // })),
    ]
    if (!res.reachEnd) {
      sync(csp, res.marker, files)
    } else {
      const dir = genBucketDir(files)
      const processedDir: dirType = {}
      Object.keys(dir).forEach(k => {
        processedDir[k] = [...dir[k]]
      })
      saveSyncData(csp.bucket, files, processedDir)
      isSyncing = false
    }
  })
}

function genDir(folders: string[], bucketDir: bucketDirType) {
  for (let i = 0; i < folders.length - 1; i++) {
    const _ = folders[i]
    const pfx = folders.slice(0, i).join('/')
    const key = `${pfx}${!!pfx.length ? '/' : ''}${_}`
    if (!bucketDir[key]) {
      bucketDir[key] = new Set()
    }
    bucketDir[key].add(folders[i + 1])
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
      bucketDir[cloudStorageDashboardTopKey].add(folders[0])
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
