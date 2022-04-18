import * as qiniu from 'qiniu'
import * as vscode from 'vscode'
import * as dayjs from 'dayjs'

import * as Request from '../request'

// ---------------------------------------------------
import qiniuKeys from './qiniu.keys'
// export default {
//   ak: '',
//   sk: '',
// }
// ---------------------------------------------------

function notiTpl(msg: string) {
  return `七牛：${msg}`
}

// const publicConfig = {
//   bucket: 'storage',
//   imgDomain: 'https://qiniu1.lxfriday.xyz/',
// }

export const qiniuConfig = {
  ak: qiniuKeys.ak,
  sk: qiniuKeys.sk,
  bucket: 'storage',
  imgDomain: 'https://qiniu1.lxfriday.xyz/',
}

const urls = {
  buckets: 'https://rs.qbox.me/buckets', //空间列表
  domains: 'https://api.qiniu.com/v6/domain/list', //空间对应的域名列表(授权空间域名返回为空)
  count: 'https://api.qiniu.com/v6/count', //统计文件数量(标准存储)
  countLine: 'https://api.qiniu.com/v6/count_line', //统计文件数量(低频存储)
  space: 'https://api.qiniu.com/v6/space', //统计文件空间(低频存储)
  spaceLine: 'https://api.qiniu.com/v6/space_line', //统计文件空间(低频存储)
}

class Qiniu {
  // base config
  ak: string
  sk: string
  bucket: string
  imgDomain: string
  expires: number
  returnBody: string

  // img list config
  marker: string // 分页用
  resourceListReachEnd: boolean // 资源是否加载完了

  qiniuMac: qiniu.auth.digest.Mac
  // qiniuConfig: qiniu.conf.Config

  constructor(params: { ak: string; sk: string; bucket: string; imgDomain: string }) {
    this.ak = params.ak
    this.sk = params.sk
    this.bucket = params.bucket
    this.imgDomain = params.imgDomain
    this.expires = 604800 // 一周
    this.returnBody =
      '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","etag":"$(etag)","mimeType":"$(mimeType)","ext":"$(ext)"}'
    this.marker = ''
    this.resourceListReachEnd = false

    this.qiniuMac = new qiniu.auth.digest.Mac(params.ak, params.sk)
    // this.qiniuConfig = new qiniu.conf.Config()
  }

  // 上传用的 token
  generateUploadToken() {
    const options = {
      scope: this.bucket,
      expires: this.expires,
      returnBody: this.returnBody,
    }
    const putPolicy = new qiniu.rs.PutPolicy(options)
    const uploadToken = putPolicy.uploadToken(this.qiniuMac)
    return uploadToken
  }

  // fromBegin 是否从头加载， true 则重置 marker
  getResourceList(
    fromBegin: boolean,
    prefix: string
  ): Promise<{ list: Array<any>; reachEnd: boolean; commonPrefixes: string[] }> {
    if (fromBegin) {
      this.resourceListReachEnd = false
    }

    // const bucketManager = new qiniu.rs.BucketManager(this.qiniuMac, this.qiniuConfig)
    const bucketManager = new qiniu.rs.BucketManager(this.qiniuMac, new qiniu.conf.Config())
    const options = {
      prefix,
      marker: fromBegin ? '' : this.marker,
      limit: 1000,
      delimiter: '/',
    }
    return new Promise((resolve, reject) => {
      if (this.resourceListReachEnd) {
        resolve({
          list: [],
          commonPrefixes: [],
          reachEnd: true,
        })
      } else {
        bucketManager.listPrefix(this.bucket, options, (respErr, respBody, respInfo) => {
          // console.log('listPrefix', {
          //   bucket: this.bucket,
          //   options,
          //   respBody,
          // })

          if (respBody.error) {
            vscode.window.showErrorMessage(notiTpl(respBody.error))
            resolve({
              list: [],
              commonPrefixes: [],
              reachEnd: true,
            })
          }

          // 依据 prefix 从 commonPrefixes 中分离出当前的 folders
          function extractCurrentFolders(cps: string[]) {
            if (!cps) {
              return []
            } else {
              const pfxReg = new RegExp(prefix)
              return cps.map(cp => {
                return cp.replace(pfxReg, '')
              })
            }
          }

          if (respBody) {
            // 加载成之后
            // 更新标记点
            if (respBody.marker) {
              this.updateMarker(respBody.marker)
              resolve({
                list: respBody.items,
                // 文件夹，会自动带上尾缀 /
                // ['testfoler/', '/']
                commonPrefixes: extractCurrentFolders(respBody.commonPrefixes),
                reachEnd: false,
              })
            } else {
              // 如果加载完了 respBody.marker 没有值，服务端不会返回这个字段
              this.updateMarker('')
              this.resourceListReachEnd = true
              resolve({
                list: respBody.items,
                commonPrefixes: extractCurrentFolders(respBody.commonPrefixes),
                reachEnd: true,
              })
            }
          } else {
            console.log('respInfo', respInfo)
            vscode.window.showErrorMessage(notiTpl('未知错误，资源列表加载失败'))
          }
        })
      }
    })
  }

  updateBucket(newBucket: string) {
    this.bucket = newBucket
    this.marker = ''
    this.resourceListReachEnd = false
  }

  updateMarker(newMarker: string) {
    this.marker = newMarker
  }

  // 获取用户的 bucket 列表
  getBucketList() {
    return Request.get({
      url: urls.buckets,
    })
  }

  // 获取 bucket 对应的 domains
  getBucketDomains(bucket: string) {
    return Request.get({
      url: urls.domains,
      params: {
        tbl: bucket,
      },
    })
  }

  generateHTTPAuthorization(url: string) {
    return qiniu.util.generateAccessToken(this.qiniuMac, url)
  }

  // 删除 bucket 中的文件
  // 删除单个文件和多个文件都走这个接口
  // ref https://developer.qiniu.com/kodo/1289/nodejs
  deleteBucketFiles(keysList: string[]) {
    const bucketManager = new qiniu.rs.BucketManager(this.qiniuMac, new qiniu.conf.Config())

    const deleteOperations = keysList.map(key => qiniu.rs.deleteOp(this.bucket, key))

    return new Promise((resolve, reject) => {
      bucketManager.batch(deleteOperations, function (respErr, respBody, respInfo) {
        if (respBody.error) {
          vscode.window.showErrorMessage(notiTpl(respBody.error))
          resolve({ result: 'error' }) // 不成功
        } else {
          // // 200 is success, 298 is part success
          if (respInfo.statusCode === 200) {
            resolve({ result: 'alldeleted' }) // 不成功
          } else {
            resolve({ result: 'partdeleted' }) // 不成功
          }
        }
      })
    })
  }

  // 获取七牛空间的文件数和文件占用空间信息
  // 用到了非 sdk 地址，官方文档也没有
  // ref https://github.com/willnewii/qiniuClient/blob/9e7b707dab0978790a754a1ebe17496d67704b03/src/renderer/cos/qiniu.js#L9
  // ref https://github.com/willnewii/qiniuClient/blob/9e7b707dab/src/renderer/cos/qiniuBucket.js#L73
  getOverviewInfo() {
    const formatStr = 'YYYYMMDD000000'
    let day = dayjs()
    let param = `?bucket=${this.bucket}&begin=${day
      .add(-1, 'day')
      .format(formatStr)}&end=${day.format(formatStr)}&g=day`

    let requests = [urls.count, urls.countLine, urls.space, urls.spaceLine].map(url => {
      return Request.get({ url: `${url}${param}` })
    })

    return new Promise((res, rej) => {
      Promise.all(requests)
        .then(result => {
          res({
            count: result[0].datas[0] || result[1].datas[0],
            space: result[2].datas[0] || result[3].datas[0],
          })
        })
        .catch(error => {
          res({
            count: 0,
            space: 0,
          })
        })
    })
  }

  //uploadMeta => [{key: '', path: ''}]
  // 在 node 端上传文件
  uploadFiles(uploadMeta: { key: string; path: string }[]) {
    console.log('uploadMeta', uploadMeta)
  }

  // 抓取网络资源到空间
  fetchResourceToBucket(url: string, key: string) {
    return new Promise<{ success: boolean; msg: string }>((res, rej) => {
      const bucketManager = new qiniu.rs.BucketManager(this.qiniuMac, new qiniu.conf.Config())
      bucketManager.fetch(url, this.bucket, key, function (err, respBody, respInfo) {
        if (err) {
          console.log('fetchResourceToBucket error', err)
          res({
            success: false,
            msg: '抓取网络资源出现错误',
          })
        } else {
          if (respInfo.statusCode === 200) {
            res({
              success: true,
              msg: '',
            })
          } else {
            console.log('fetchResourceToBucket !== 200', respInfo)
            res({
              success: false,
              msg: respBody.error,
            })
          }
        }
      })
    })
  }

  // 批量移动或者重命名，移动和重命名是同一个操作，只是对 key 做重命名而已
  moveBucketFiles(keysInfoList: { originalKey: string; newKey: string }[]) {
    const bucketManager = new qiniu.rs.BucketManager(this.qiniuMac, new qiniu.conf.Config())

    const moveOperations = keysInfoList.map(({ originalKey, newKey }) =>
      qiniu.rs.moveOp(this.bucket, originalKey, this.bucket, newKey)
    )

    return new Promise<{ result: string; msg: string }>((resolve, reject) => {
      bucketManager.batch(moveOperations, function (respErr, respBody, respInfo) {
        console.log('moveBucketFiles', { respErr, respBody, respInfo })

        if (respBody.error) {
          vscode.window.showErrorMessage(notiTpl(respBody.error))
          resolve({ result: 'error', msg: respBody.error }) // 不成功
        } else {
          // // 200 is success, 298 is part success
          if (respInfo.statusCode === 200) {
            resolve({ result: 'allmoved', msg: '' }) // 全部成功
          } else {
            resolve({ result: 'partmoved', msg: '' }) // 部分成功
          }
        }
      })
    })
  }

  // 按照链接刷新文件，一次最多100个 ['http://if-pbl.qiniudn.com/examples/',]，一天最多刷500个
  // ref https://developer.qiniu.com/kodo/1289/nodejs#fusion-refresh-urls
  // https://developer.qiniu.com/dcdn/10755/dcdn-cache-refresh-with-the-query

  refreshFiles(fileUrls: string[]) {
    const cdnManager = new qiniu.cdn.CdnManager(this.qiniuMac)
    return new Promise((resolve, reject) => {
      cdnManager.refreshUrls(fileUrls, function (err, respBody, respInfo) {
        if (respBody.code === 200) {
          resolve({
            success: true,
            msg: '刷新成功',
            urlSurplusDay: respBody.urlSurplusDay, // 每日剩余的 url 刷新限额（文件）
          })
        } else {
          resolve({
            success: false,
            msg: respBody.error,
          })
        }
      })
    })
  }

  // 按照链接刷新文件夹，最多10个
  // ref https://developer.qiniu.com/kodo/1289/nodejs#fusion-refresh-dirs
  refreshDirs(dirUrls: string[]) {
    console.log('refreshDirs', dirUrls)
    const cdnManager = new qiniu.cdn.CdnManager(this.qiniuMac)
    return new Promise((resolve, reject) => {
      cdnManager.refreshDirs(dirUrls, function (err, respBody, respInfo) {
        console.log('refreshDirs', {
          err,
          respBody,
          respInfo,
        })

        if (respBody.code === 200) {
          resolve({
            success: true,
            msg: '刷新成功',
            urlSurplusDay: respBody.urlSurplusDay, // 每日剩余的 url 刷新限额（文件）
          })
        } else {
          resolve({
            success: false,
            msg: respBody.error,
          })
        }
      })
    })
  }
}

const qiniuE = new Qiniu({
  ak: qiniuConfig.ak,
  sk: qiniuConfig.sk,
  bucket: qiniuConfig.bucket,
  imgDomain: qiniuConfig.imgDomain,
})

export default qiniuE
