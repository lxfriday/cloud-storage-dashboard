import * as qiniu from 'qiniu'
import * as vscode from 'vscode'
import * as Request from './request'

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

// export function generateQiniuUploadToken() {
//   const options = {
//     scope: baseConfig.bucket,
//     expires: 7200, // 7200s => 2h
//     returnBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)"}',
//   }
//   const putPolicy = new qiniu.rs.PutPolicy(options)
//   const uploadToken = putPolicy.uploadToken(mac)
//   return uploadToken
// }

// // 拉取资源 https://www.cnblogs.com/kangshuishneg/p/12556287.html
// export function getResourceList() {
//   const bucketManager = new qiniu.rs.BucketManager(mac, config)
//   const options = {
//     limit: 100,
//     // prefix: 'testfolder/',
//     prefix: '',
//     marker: '',
//     // marker:
//     // 'eyJjIjowLCJrIjoiV2F0ZXJNLzU4YTI3M2UyLWVlZWMtNDFjNy1iMTFiLTcyODQ1NDFkOWMxY19RUTIwMTkwNTI1LTIwMTQwMi1yZWZlcmVyLnBuZyJ9',
//   }
//   bucketManager.listPrefix(publicConfig.bucket, options, function (respErr, respBody, respInfo) {
//     console.log('list result', { respBody, respErr, respInfo })
//     if (respBody.error) {
//       vscode.window.showErrorMessage(notiTpl(respBody.error))
//     }
//     if (respBody) {
//       console.log('respBody', respBody)
//     } else {
//       console.log('respInfo', respInfo)
//     }
//   })
// }

class Qiniu {
  // base config
  ak: string
  sk: string
  bucket: string
  imgDomain: string
  expires: number
  returnBody: string

  // img list config
  limit: number // 单页加载条目数
  prefix: string // folder 用
  marker: string // 分页用

  qiniuMac: qiniu.auth.digest.Mac
  // qiniuConfig: qiniu.conf.Config

  constructor(params: { ak: string; sk: string; bucket: string; imgDomain: string }) {
    this.ak = params.ak
    this.sk = params.sk
    this.bucket = params.bucket
    this.imgDomain = params.imgDomain
    this.expires = 7200
    this.returnBody =
      '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","etag":"$(etag)","mimeType":"$(mimeType)","ext":"$(ext)"}'
    this.limit = 100
    this.prefix = ''
    this.marker = ''

    this.qiniuMac = new qiniu.auth.digest.Mac(params.ak, params.sk)
    // this.qiniuConfig = new qiniu.conf.Config()
  }

  // 上传用的 token
  generateQiniuUploadToken() {
    const options = {
      scope: this.bucket,
      expires: this.expires,
      returnBody: this.returnBody,
    }
    const putPolicy = new qiniu.rs.PutPolicy(options)
    const uploadToken = putPolicy.uploadToken(this.qiniuMac)
    return uploadToken
  }

  getResourceList(): Promise<{ list: Array<any>; reachEnd: boolean }> {
    // const bucketManager = new qiniu.rs.BucketManager(this.qiniuMac, this.qiniuConfig)
    const bucketManager = new qiniu.rs.BucketManager(this.qiniuMac, new qiniu.conf.Config())
    const options = {
      limit: this.limit,
      // prefix: 'testfolder/',
      prefix: this.prefix,
      marker: this.marker,
      // marker:
      // 'eyJjIjowLCJrIjoiV2F0ZXJNLzU4YTI3M2UyLWVlZWMtNDFjNy1iMTFiLTcyODQ1NDFkOWMxY19RUTIwMTkwNTI1LTIwMTQwMi1yZWZlcmVyLnBuZyJ9',
    }
    return new Promise((resolve, reject) => {
      bucketManager.listPrefix(this.bucket, options, (respErr, respBody, respInfo) => {
        if (respBody.error) {
          vscode.window.showErrorMessage(notiTpl(respBody.error))
        }
        if (respBody) {
          // 加载成之后
          // 更新标记点
          this.updateMarker(respBody.marker)
          resolve({
            list: respBody.items,
            reachEnd: false,
          })
        } else {
          console.log('respInfo', respInfo)
        }
      })
    })
  }

  updateBucket(newBucket: string) {
    this.bucket = newBucket
    this.prefix = ''
    this.marker = ''
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
}

const qiniuE = new Qiniu({
  ak: qiniuConfig.ak,
  sk: qiniuConfig.sk,
  bucket: qiniuConfig.bucket,
  imgDomain: qiniuConfig.imgDomain,
})

export default qiniuE
