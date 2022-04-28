import * as qiniu from 'qiniu'
import * as vscode from 'vscode'
import * as dayjs from 'dayjs'

import * as Request from '../request'
import * as boot from '../boot'

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

export const qiniuConfig = {
  ak: qiniuKeys.ak,
  sk: qiniuKeys.sk,
  bucket: 'storage',
  // imgDomain: 'https://qiniu1.lxfriday.xyz/',
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
  ak: string = ''
  sk: string = ''
  bucket: string = ''
  expires: number = 604800
  returnBody: string =
    '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","etag":"$(etag)","mimeType":"$(mimeType)","ext":"$(ext)"}'

  // img list config
  qiniuMac: qiniu.auth.digest.Mac | null = null

  constructor(ak: string, sk: string, bucket: string) {
    this.ak = ak
    this.sk = sk
    this.bucket = bucket
    this.qiniuMac = new qiniu.auth.digest.Mac(ak, sk)
  }

  // 登录，通过请求一个接口看是否成功来决定登录是否成功
  // 登录的时候有一个很重要的事情：设置当前的 ak、sk
  async login(cspInfo: { csp: string; ak: string; sk: string; nickname: string }) {
    const res = await this.getBucketList()
    if (res.error) {
      return {
        success: false,
        msg: res.error,
      }
    }
    // 把登录信息保存在本地
    const settings = boot.login(cspInfo)
    return {
      success: true,
      settings,
    }
  }

  // 上传用的 token
  generateUploadToken() {
    const options = {
      scope: this.bucket,
      expires: this.expires,
      returnBody: this.returnBody,
    }
    const putPolicy = new qiniu.rs.PutPolicy(options)
    const uploadToken = putPolicy.uploadToken(<qiniu.auth.digest.Mac>this.qiniuMac)
    return uploadToken
  }

  // fromBegin 是否从头加载
  getResourceList(
    fromBegin: boolean,
    prefix: string,
    marker: string
  ): Promise<{ list: Array<any>; reachEnd: boolean; commonPrefixes: string[]; marker: string }> {
    const bucketManager = new qiniu.rs.BucketManager(
      <qiniu.auth.digest.Mac>this.qiniuMac,
      new qiniu.conf.Config()
    )
    const options = {
      prefix,
      marker,
      limit: 1000,
      delimiter: '/',
    }
    return new Promise((resolve, reject) => {
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
            marker: '',
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
            resolve({
              list: respBody.items,
              // 文件夹，会自动带上尾缀 /
              // ['testfoler/', '/']
              commonPrefixes: extractCurrentFolders(respBody.commonPrefixes),
              reachEnd: false,
              marker: respBody.marker,
            })
          } else {
            // 如果加载完了 respBody.marker 没有值，服务端不会返回这个字段
            resolve({
              list: respBody.items,
              commonPrefixes: extractCurrentFolders(respBody.commonPrefixes),
              reachEnd: true,
              marker: '',
            })
          }
        } else {
          console.log('respInfo', respInfo)
          vscode.window.showErrorMessage(notiTpl('未知错误，资源列表加载失败'))
        }
      })
    })
  }

  // 获取用户的 bucket 列表
  getBucketList() {
    return Request.qiniuGet(
      {
        url: urls.buckets,
      },
      this.generateHTTPAuthorization
    )
  }

  // 获取 bucket 对应的 domains
  getBucketDomains() {
    const bucket = this.bucket
    return Request.qiniuGet(
      {
        url: urls.domains,
        params: {
          tbl: bucket,
        },
      },
      this.generateHTTPAuthorization
    )
  }

  // 要作为参数传递，所以是箭头函数
  generateHTTPAuthorization = (url: string) => {
    return qiniu.util.generateAccessToken(<qiniu.auth.digest.Mac>this.qiniuMac, url)
  }

  // 删除 bucket 中的文件
  // 删除单个文件和多个文件都走这个接口
  // ref https://developer.qiniu.com/kodo/1289/nodejs
  deleteBucketFiles(keysList: string[]) {
    const bucketManager = new qiniu.rs.BucketManager(
      <qiniu.auth.digest.Mac>this.qiniuMac,
      new qiniu.conf.Config()
    )

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
      return Request.qiniuGet({ url: `${url}${param}` }, this.generateHTTPAuthorization)
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

  // 抓取网络资源到空间
  fetchResourceToBucket(url: string, key: string) {
    return new Promise<{ success: boolean; msg: string }>((res, rej) => {
      const bucketManager = new qiniu.rs.BucketManager(
        <qiniu.auth.digest.Mac>this.qiniuMac,
        new qiniu.conf.Config()
      )
      bucketManager.fetch(url, this.bucket, key, function (err, respBody, respInfo) {
        if (err) {
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
    const bucketManager = new qiniu.rs.BucketManager(
      <qiniu.auth.digest.Mac>this.qiniuMac,
      new qiniu.conf.Config()
    )

    const moveOperations = keysInfoList.map(({ originalKey, newKey }) =>
      qiniu.rs.moveOp(this.bucket, originalKey, this.bucket, newKey)
    )

    return new Promise<{ result: string; msg: string }>((resolve, reject) => {
      bucketManager.batch(moveOperations, function (respErr, respBody, respInfo) {
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
    const cdnManager = new qiniu.cdn.CdnManager(<qiniu.auth.digest.Mac>this.qiniuMac)
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
    const cdnManager = new qiniu.cdn.CdnManager(<qiniu.auth.digest.Mac>this.qiniuMac)
    return new Promise((resolve, reject) => {
      cdnManager.refreshDirs(dirUrls, function (err, respBody, respInfo) {
        if (respBody.code === 200) {
          resolve({
            success: true,
            msg: '刷新成功',
            dirSurplusDay: respBody.dirSurplusDay, // 每日剩余的 url 刷新限额（文件）
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

export default Qiniu
