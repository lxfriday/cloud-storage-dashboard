import * as qiniu from 'qiniu'
import * as dayjs from 'dayjs'
import axios from 'axios'

import * as Request from '../request'
import * as boot from '../boot'
import {
  constructorParamsType,
  resourceListItemType,
  resourceListItemWithSignatureUrlType,
  resourceListDataType,
  CSPAdaptor,
  extractCurrentFolders,
} from './cspAdaptor.common'

function notiTpl(msg: string) {
  return `七牛：${msg}`
}

const urls = {
  buckets: 'https://rs.qbox.me/buckets', //空间列表
  domains: 'https://api.qiniu.com/v6/domain/list', //空间对应的域名列表(授权空间域名返回为空)
  count: 'https://api.qiniu.com/v6/count', //统计文件数量(标准存储)
  countLine: 'https://api.qiniu.com/v6/count_line', //统计文件数量(低频存储)
  space: 'https://api.qiniu.com/v6/space', //统计文件空间(低频存储)
  spaceLine: 'https://api.qiniu.com/v6/space_line', //统计文件空间(低频存储)
}

class Qiniu extends CSPAdaptor {
  // base config
  ak: string = ''
  sk: string = ''
  nickname: string = ''
  csp: string = '' // csp id
  bucket: string = ''
  expires: number = 604800 // 1周
  returnBody: string =
    '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","etag":"$(etag)","mimeType":"$(mimeType)","ext":"$(ext)"}'

  // img list config
  qiniuMac: qiniu.auth.digest.Mac | null = null

  constructor(params: constructorParamsType) {
    super(params)
    this.ak = params.ak
    this.sk = params.sk
    this.nickname = params.nickname
    this.csp = params.csp
    this.bucket = params.bucket
    this.qiniuMac = new qiniu.auth.digest.Mac(params.ak, params.sk)
  }

  // 登录，通过请求一个接口看是否成功来决定登录是否成功
  // 登录的时候有一个很重要的事情：设置当前的 ak、sk
  public async login(cspInfo: { csp: string; ak: string; sk: string; nickname: string }) {
    const res = await this.getBucketList(true)
    if (!res.success) {
      return {
        success: false,
        msg: res.msg,
      }
    }
    // 把登录信息保存在本地
    const loginRes = boot.login(cspInfo)
    return loginRes
  }

  // 上传用的 token
  public async generateUploadToken(): Promise<{
    success: boolean
    data: string
  }> {
    const options = {
      scope: this.bucket,
      expires: this.expires,
      returnBody: this.returnBody,
    }
    const putPolicy = new qiniu.rs.PutPolicy(options)
    const uploadToken = putPolicy.uploadToken(<qiniu.auth.digest.Mac>this.qiniuMac)
    return {
      success: true,
      data: uploadToken,
    }
  }

  // 本地同步用的
  public getResourceListForSync(marker: string): Promise<{
    success: boolean
    data?: {
      list: resourceListItemType[]
      reachEnd: boolean
      marker: string
    }
    msg?: string
  }> {
    const bucketManager = new qiniu.rs.BucketManager(
      <qiniu.auth.digest.Mac>this.qiniuMac,
      new qiniu.conf.Config()
    )
    const options = {
      prefix: '',
      marker,
    }
    return new Promise((resolve, reject) => {
      bucketManager.listPrefix(this.bucket, options, (respErr, respBody, respInfo) => {
        if (respErr) {
          resolve({
            success: false,
            msg: String(respErr),
          })
        } else {
          const list: resourceListItemType[] = []
          ;(<any[]>respBody.items).forEach(_ => {
            if (_.key[_.key.length - 1] !== '/') {
              list.push({
                fsize: _.fsize,
                hash: _.hash,
                key: _.key,
                md5: _.md5,
                putTime: new Date(+`${_.putTime}`.slice(0, 13)).toLocaleString(),
                mimeType: _.mimeType,
              })
            }
          })
          resolve({
            success: true,
            data: {
              list,
              // 文件夹，会自动带上尾缀 /
              // ['testfoler/', '/']
              reachEnd: !!respBody.marker ? false : true,
              marker: !!respBody.marker ? respBody.marker : '',
            },
          })
        }
      })
    })
  }

  public getSignatureUrl(
    keys: string[],
    domain: string
  ): Promise<{ success: boolean; data?: string[]; msg?: string }> {
    const that = this
    const bucketManager = new qiniu.rs.BucketManager(
      <qiniu.auth.digest.Mac>this.qiniuMac,
      new qiniu.conf.Config()
    )
    return new Promise((res, rej) => {
      try {
        const urls = keys.map(_ =>
          bucketManager.privateDownloadUrl(domain, _, Math.floor(Date.now() / 1000) + 3600)
        )
        res({
          success: true,
          data: urls,
        })
      } catch (e) {
        res({
          success: false,
          msg: String(e),
        })
      }
    })
  }

  // fromBegin 是否从头加载
  public getResourceList(
    fromBegin: boolean,
    prefix: string,
    marker: string,
    isBucketPrivateRead: boolean,
    domain: string
  ): Promise<{
    success: boolean
    msg?: string
    data?: resourceListDataType
  }> {
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
        if (respErr) {
          resolve({
            success: false,
            msg: String(respErr),
          })
        } else {
          // 加载成之后
          // 更新标记点
          try {
            const list: resourceListItemWithSignatureUrlType[] = []
            ;(<any[]>respBody.items).forEach(_ => {
              // 删掉文件夹占位文件
              if (_.key[_.key.length - 1] !== '/') {
                list.push({
                  fsize: _.fsize,
                  hash: _.hash,
                  key: _.key,
                  md5: _.md5,
                  putTime: new Date(+`${_.putTime}`.slice(0, 13)).toLocaleString(),
                  mimeType: _.mimeType,
                  signatureUrl: isBucketPrivateRead
                    ? bucketManager.privateDownloadUrl(
                        domain,
                        _.key,
                        Math.floor(Date.now() / 1000) + 3600
                      )
                    : '',
                })
              }
            })
            resolve({
              success: true,
              data: {
                list,
                // 文件夹，会自动带上尾缀 /
                // ['testfoler/', '/']
                commonPrefixes: extractCurrentFolders(respBody.commonPrefixes, prefix),
                reachEnd: !!respBody.marker ? false : true,
                marker: !!respBody.marker ? respBody.marker : '',
              },
            })
          } catch (e) {
            resolve({
              success: false,
              msg: String(e),
            })
          }
        }
      })
    })
  }

  // 通过hack的方式获取到 bucket 的 acl 信息
  // 通过访问 bucket 绑定的域名
  // 如果是 401 则表示未授权是私有的
  // 如果是 404 则表示是正常访问的
  private _getBucketACL(bucket: string): Promise<{ isPrivate: boolean }> {
    return new Promise((res, rej) => {
      Request.qiniuGet(
        {
          url: urls.domains,
          params: {
            tbl: bucket,
          },
        },
        this.generateHTTPAuthorization
      )
        .then(domainRes => {
          if (domainRes.success) {
            const domains = domainRes.data
            if (domains.length) {
              axios(`http://${domains[0]}`, { method: 'GET' })
                .then(domainCheckRes => {
                  // @ts-ignore
                  if (domainCheckRes.code === 401) {
                    res({
                      isPrivate: true,
                    })
                  } else {
                    res({
                      isPrivate: false,
                    })
                  }
                })
                .catch(e => {
                  console.log('axios error', e)
                  res({
                    isPrivate: false,
                  })
                })
            } else {
              res({
                isPrivate: false,
              })
            }
          }
        })
        .catch(e => {
          res({
            isPrivate: false,
          })
        })
    })
  }

  // 获取用户的 bucket 列表
  public getBucketList(usedAsLogin: boolean = false): Promise<{
    success: boolean
    data?: {
      name: string
      region: string
      acl: string
      isPrivateRead: boolean
      isPublicRead: boolean
    }[]
    msg?: string
  }> {
    const that = this
    return new Promise((res, rej) => {
      Request.qiniuGet(
        {
          url: urls.buckets,
        },
        this.generateHTTPAuthorization
      )
        .then(bucketRes => {
          if (bucketRes.success) {
            const bucketList = (bucketRes.data as string[]).map(_ => ({
              name: _,
              region: '',
              acl: '',
              isPrivateRead: false,
              isPublicRead: true,
            }))
            if (usedAsLogin) {
              res({
                success: true,
                data: bucketList,
              })
            } else {
              Promise.all<
                Promise<{
                  name: string
                  region: string
                  acl: string
                  isPrivateRead: boolean
                  isPublicRead: boolean
                }>[]
              >(
                bucketList.map(
                  _ =>
                    new Promise((res2, rej2) => {
                      that._getBucketACL(_.name).then(result => {
                        res2({
                          name: _.name,
                          region: '',
                          acl: result.isPrivate ? 'private' : 'public',
                          isPrivateRead: result.isPrivate,
                          isPublicRead: true,
                        })
                      })
                    })
                )
              )
                .then(totalACLResult => {
                  res({
                    success: true,
                    data: totalACLResult,
                  })
                })
                .catch(totalACLError => {
                  console.log('totalACLError', totalACLError)
                  res({
                    success: true,
                    data: bucketList,
                  })
                })
            }
          } else {
            res({
              success: false,
              msg: bucketRes.msg,
            })
          }
        })
        .catch(e => {
          res({
            success: false,
            msg: String(e),
          })
        })
    })
  }

  // 获取 bucket 对应的 domains
  public async getBucketDomains(): Promise<{ success: boolean; data?: string[]; msg?: string }> {
    try {
      const bucket = this.bucket
      const res = await Request.qiniuGet(
        {
          url: urls.domains,
          params: {
            tbl: bucket,
          },
        },
        this.generateHTTPAuthorization
      )
      if (res.success) {
        return {
          success: true,
          data: res.data,
        }
      } else {
        return {
          success: false,
          msg: res.msg,
        }
      }
    } catch (e) {
      return {
        success: false,
        msg: String(e),
      }
    }
  }

  // 要作为参数传递，所以是箭头函数
  private generateHTTPAuthorization = (url: string) => {
    return qiniu.util.generateAccessToken(<qiniu.auth.digest.Mac>this.qiniuMac, url)
  }

  // 删除 bucket 中的文件
  // 删除单个文件和多个文件都走这个接口
  // ref https://developer.qiniu.com/kodo/1289/nodejs
  public deleteBucketFiles(
    keysList: string[]
  ): Promise<{ success: boolean; data?: 'alldeleted' | 'partdeleted' | 'error'; msg?: string }> {
    const bucketManager = new qiniu.rs.BucketManager(
      <qiniu.auth.digest.Mac>this.qiniuMac,
      new qiniu.conf.Config()
    )

    const deleteOperations = keysList.map(key => qiniu.rs.deleteOp(this.bucket, key))

    return new Promise((resolve, reject) => {
      bucketManager.batch(deleteOperations, function (respErr, respBody, respInfo) {
        if (respErr) {
          resolve({ success: true, data: 'error', msg: String(respErr) }) // 不成功
        } else {
          if (respBody.error) {
            resolve({ success: true, data: 'error' }) // 不成功
          } else {
            // // 200 is success, 298 is part success
            if (respInfo.statusCode === 200) {
              resolve({ success: true, data: 'alldeleted' }) // 不成功
            } else {
              resolve({ success: true, data: 'partdeleted' }) // 不成功
            }
          }
        }
      })
    })
  }

  // 获取七牛空间的文件数和文件占用空间信息
  // 用到了非 sdk 地址，官方文档也没有
  // ref https://github.com/willnewii/qiniuClient/blob/9e7b707dab0978790a754a1ebe17496d67704b03/src/renderer/cos/qiniu.js#L9
  // ref https://github.com/willnewii/qiniuClient/blob/9e7b707dab/src/renderer/cos/qiniuBucket.js#L73
  public getOverviewInfo(): Promise<{
    success: boolean
    data: {
      count: number
      space: number
    }
  }> {
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
            success: true,
            data: {
              count: result[0].datas[0] || result[1].datas[0],
              space: result[2].datas[0] || result[3].datas[0],
            },
          })
        })
        .catch(error => {
          res({
            success: true,
            data: {
              count: 0,
              space: 0,
            },
          })
        })
    })
  }

  // 抓取网络资源到空间
  public fetchResourceToBucket(
    url: string,
    key: string
  ): Promise<{
    success: boolean
    msg?: string
  }> {
    return new Promise((res, rej) => {
      const bucketManager = new qiniu.rs.BucketManager(
        <qiniu.auth.digest.Mac>this.qiniuMac,
        new qiniu.conf.Config()
      )
      bucketManager.fetch(url, this.bucket, key, function (err, respBody, respInfo) {
        if (err) {
          res({
            success: false,
            msg: String(err),
          })
        } else {
          if (respInfo.statusCode === 200) {
            res({
              success: true,
            })
          } else {
            // 抓取出现 404 的时候会走到这里
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
  public moveBucketFile(keysInfo: { originalKey: string; newKey: string }): Promise<{
    success: boolean
    msg?: string
  }> {
    const bucketManager = new qiniu.rs.BucketManager(
      <qiniu.auth.digest.Mac>this.qiniuMac,
      new qiniu.conf.Config()
    )

    const moveOperations = [
      qiniu.rs.moveOp(this.bucket, keysInfo.originalKey, this.bucket, keysInfo.newKey),
    ]

    return new Promise((resolve, reject) => {
      bucketManager.batch(moveOperations, function (respErr, respBody, respInfo) {
        if (respErr) {
          resolve({ success: false, msg: String(respErr) }) // 不成功
        } else {
          if (respBody && respBody[0] && respBody[0].data && respBody[0].data.error) {
            // 重命名失败都会走这里
            resolve({ success: false, msg: respBody[0].data.error }) // 不成功
          } else {
            // // 200 is success, 298 is part success
            resolve({ success: true }) // 全部成功
            // if (respInfo.statusCode === 200) {
            //   resolve({ success: true, data: 'allmoved' }) // 全部成功
            // } else {
            //   resolve({ success: true, data: 'partmoved' }) // 部分成功
            // }
          }
        }
      })
    })
  }

  // 按照链接刷新文件，一次最多100个 ['http://if-pbl.qiniudn.com/examples/',]，一天最多刷500个
  // ref https://developer.qiniu.com/kodo/1289/nodejs#fusion-refresh-urls
  // https://developer.qiniu.com/dcdn/10755/dcdn-cache-refresh-with-the-query

  public refreshFiles(fileUrls: string[]): Promise<{
    success: boolean
    msg?: string
    data?: {
      leftCount: number | string // 剩余可刷新余额
    }
  }> {
    const cdnManager = new qiniu.cdn.CdnManager(<qiniu.auth.digest.Mac>this.qiniuMac)
    return new Promise((resolve, reject) => {
      cdnManager.refreshUrls(fileUrls, function (err, respBody, respInfo) {
        if (err) {
          resolve({
            success: false,
            msg: String(err),
          })
        } else {
          if (respBody && respBody.code === 200) {
            resolve({
              success: true,
              data: {
                leftCount: respBody.urlSurplusDay, // 每日剩余的 url 刷新限额（文件）
              },
            })
          } else {
            resolve({
              success: false,
              msg: respBody.error,
            })
          }
        }
      })
    })
  }

  // 按照链接刷新文件夹，最多10个
  // ref https://developer.qiniu.com/kodo/1289/nodejs#fusion-refresh-dirs
  public refreshDirs(dirUrls: string[]): Promise<{
    success: boolean
    msg?: string
    data?: {
      leftCount: number | string // 剩余可刷新余额
    }
  }> {
    const cdnManager = new qiniu.cdn.CdnManager(<qiniu.auth.digest.Mac>this.qiniuMac)
    return new Promise((resolve, reject) => {
      cdnManager.refreshDirs(dirUrls, function (err, respBody, respInfo) {
        if (err) {
          resolve({
            success: false,
            msg: String(err),
          })
        } else {
          if (respBody.code === 200) {
            resolve({
              success: true,
              data: {
                leftCount: respBody.dirSurplusDay,
              },
            })
          } else {
            resolve({
              success: false,
              msg: respBody.error,
            })
          }
        }
      })
    })
  }
}

export default Qiniu
