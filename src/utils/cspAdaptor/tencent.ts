// https://console.cloud.tencent.com/api/explorer?Product=cdn&Version=2018-06-06&Action=PurgeUrlsCache API explorer
import * as COS from 'cos-nodejs-sdk-v5'
import * as tencentcloud from 'tencentcloud-sdk-nodejs'
import * as STS from 'qcloud-cos-sts'

import { Client } from 'tencentcloud-sdk-nodejs/tencentcloud/services/cdn/v20180606/cdn_client'
import * as boot from '../boot'
// @ts-ignore
import * as lodashTrim from 'lodash.trim'
import {
  constructorParamsType,
  resourceListItemType,
  resourceListItemWithSignatureUrlType,
  resourceListDataType,
  CSPAdaptor,
  extractCurrentFolders,
  signatureUrlExpires,
} from './cspAdaptor.common'

const CdnClient = tencentcloud.cdn.v20180606.Client

class Tencent extends CSPAdaptor {
  cos: COS
  cdn: Client
  secretId: string
  secretKey: string
  bucket: string
  region: string
  constructor(params: constructorParamsType) {
    super(params)
    this.cos = new COS({
      SecretId: params.ak,
      SecretKey: params.sk,
      // Domain: 'qcloud-test.lxfriday.xyz',
      Protocol: 'https:',
    })
    this.cdn = new CdnClient({
      credential: {
        secretId: params.ak,
        secretKey: params.sk,
      },
      region: params.region,
    })
    this.secretId = params.ak
    this.secretKey = params.sk
    this.bucket = params.bucket
    this.region = params.region
  }

  public async login(cspInfo: { csp: string; ak: string; sk: string; nickname: string }): Promise<{
    success: boolean
    msg?: string
    data?: any
  }> {
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

  // https://github.com/tencentyun/qcloud-cos-sts-sdk/blob/master/nodejs/demo/sts-server.js sts
  // https://cloud.tencent.com/document/product/436/14048 临时密钥生成及使用指引
  // https://cloud.tencent.com/document/product/436/64960 js sdk
  public async generateUploadToken(): Promise<{
    success: boolean
    data?: string
    msg?: string
  }> {
    const that = this
    return new Promise((res, rej) => {
      const config = {
        secretId: that.secretId,
        secretKey: that.secretKey,
        proxy: '',
        durationSeconds: 3600, // 1小时

        // 放行判断相关参数
        bucket: that.bucket,
        region: that.region,
        allowPrefix: '*',
        // 简单上传和分片，需要以下的权限，其他权限列表请看 https://cloud.tencent.com/document/product/436/31923
        allowActions: [
          // 简单上传
          'name/cos:PutObject',
          'name/cos:PostObject',
          // 分片上传
          'name/cos:InitiateMultipartUpload',
          'name/cos:ListMultipartUploads',
          'name/cos:ListParts',
          'name/cos:UploadPart',
          'name/cos:CompleteMultipartUpload',
        ],
      }
      const shortBucketName = config.bucket.substr(0, config.bucket.lastIndexOf('-'))
      const appId = config.bucket.substr(1 + config.bucket.lastIndexOf('-'))
      const policy = {
        version: '2.0',
        statement: [
          {
            action: config.allowActions,
            effect: 'allow',
            principal: { qcs: ['*'] },
            resource: [
              'qcs::cos:' +
                config.region +
                ':uid/' +
                appId +
                ':prefix//' +
                appId +
                '/' +
                shortBucketName +
                '/' +
                config.allowPrefix,
            ],
          },
        ],
      }
      STS.getCredential(
        {
          secretId: config.secretId,
          secretKey: config.secretKey,
          proxy: config.proxy,
          durationSeconds: config.durationSeconds,
          policy: policy,
        },
        function (err, tempKeys) {
          if (err) {
            res({
              success: false,
              // @ts-ignore
              msg: err.Message,
            })
          } else {
            var result = JSON.stringify({
              ...tempKeys,
              bucket: that.bucket,
              region: that.region,
            })
            res({
              success: true,
              data: result,
            })
          }
        }
      )
    })
  }

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
      that.cos.getService({}, function (err, data) {
        if (err) {
          res({
            success: false,
            msg: err.message,
          })
        } else {
          const buckets = data.Buckets.map(_ => ({
            name: _.Name,
            region: _.Location,
            acl: '',
            isPrivateRead: false,
            isPublicRead: true,
          }))
          if (usedAsLogin) {
            res({
              success: true,
              data: buckets,
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
              buckets.map(
                _ =>
                  new Promise((resolve, reject) => {
                    that.cos.getBucketAcl(
                      {
                        Bucket: _.name,
                        Region: _.region,
                      },
                      (err2, data2) => {
                        if (err2) {
                          reject(err2)
                        } else {
                          // acl："private" "public-read" "public-read-write"
                          resolve({
                            name: _.name,
                            region: _.region,
                            acl: data2.ACL,
                            isPrivateRead: data2.ACL.includes('private'),
                            isPublicRead: data2.ACL.includes('public-read'),
                          })
                        }
                      }
                    )
                  })
              )
            )
              .then(bucketsInfo => {
                res({
                  success: true,
                  data: bucketsInfo,
                })
              })
              .catch(e => {
                console.log('获取bucket访问权限失败', e)
                res({
                  success: true,
                  data: buckets,
                })
              })
          }
        }
      })
    })
  }

  public getBucketDomains(): Promise<{ success: boolean; data?: string[]; msg?: string }> {
    const that = this
    return new Promise((res, rej) => {
      that.cdn.DescribeDomains({}, (err, data) => {
        if (err) {
          res({
            success: false,
            msg: String(err),
          })
        } else {
          const domain = [
            `${that.bucket}.cos.${that.region}.myqcloud.com`,
            `${that.bucket}.file.myqcloud.com`,
          ]
          data.Domains.forEach(_ => {
            if (_.Cname && _.Cname.length) {
              _.Domain && domain.push(_.Domain)
            }
          })
          res({
            success: true,
            data: domain,
          })
        }
      })
    })
    // return {
    //   success: true,
    //   data: [`${this.bucket}.cos.${this.region}.myqcloud.com`, `${this.bucket}.file.myqcloud.com`],
    // }
  }

  // 本地同步用的
  public getResourceListForSync(marker: string): Promise<{
    success: boolean
    data?: {
      list: Array<any>
      reachEnd: boolean
      marker: string
    }
    msg?: string
  }> {
    return new Promise((res, rej) => {
      this.cos.getBucket(
        {
          Bucket: this.bucket,
          Region: this.region,
          Prefix: '',
          Marker: marker,
          MaxKeys: 1000,
        },
        function (err, data) {
          if (err) {
            res({
              success: false,
              msg: err.message,
            })
          } else {
            const list: resourceListItemType[] = []
            // 避免文件夹占位符也纳入了统计范围
            data.Contents.forEach(_ => {
              // 腾讯云在查询带prefix的列表返回值中，列表第一个是 prefix，要删掉
              // 查询 prefix 的时候，要带尾 /
              if (_.Key[_.Key.length - 1] !== '/') {
                list.push({
                  fsize: +_.Size,
                  hash: '',
                  key: _.Key,
                  md5: lodashTrim(_.ETag, '"'),
                  putTime: new Date(_.LastModified).toLocaleString(),
                  mimeType: '', // 腾讯没有 mime
                })
              }
            })
            res({
              success: true,
              data: {
                list,
                reachEnd: data.IsTruncated === 'true' ? false : true,
                // NextMarker 是加载后续的 marker
                marker: data.NextMarker ? data.NextMarker : '',
              },
            })
          }
        }
      )
    })
  }

  public getSignatureUrl(
    keys: string[],
    domain: string,
    expires: number
  ): Promise<{ success: boolean; data?: string[]; msg?: string }> {
    const that = this
    return new Promise((res, rej) => {
      Promise.all<Promise<string>[]>(
        keys.map(_ => {
          return new Promise((res2, rej2) => {
            that.cos.getObjectUrl(
              {
                Bucket: that.bucket,
                Region: that.region,
                Key: _,
                Sign: true,
                Expires: expires,
              },
              (err, data) => {
                if (err) {
                  rej2(err.message)
                } else {
                  res2(data.Url)
                }
              }
            )
          })
        })
      )
        .then(signatureUrls => {
          res({
            success: true,
            data: signatureUrls,
          })
        })
        .catch(e => {
          console.log('腾讯云签名url生成失败', e)
          res({
            success: false,
            msg: String(e),
          })
        })
    })
  }

  // https://cloud.tencent.com/document/product/436/64982
  public getResourceList(
    fromBegin: boolean,
    prefix: string,
    marker: string,
    isBucketPrivateRead: boolean,
    domain: string
  ): Promise<{ success: boolean; data?: resourceListDataType; msg?: string }> {
    const that = this
    return new Promise((res, rej) => {
      this.cos.getBucket(
        {
          Bucket: this.bucket,
          Region: this.region,
          Prefix: prefix,
          Marker: marker,
          // Delimiter = '/' 的时候 commonPrefixes 才会有值
          // Delimiter: prefix[prefix.length - 1] === '/' || prefix === '' ? '/' : '',
          Delimiter: '/',
        },
        function (err, data) {
          if (err) {
            res({
              success: false,
              msg: err.message,
            })
          } else {
            const list: resourceListItemWithSignatureUrlType[] = []
            const resData = {
              list: list,
              commonPrefixes: extractCurrentFolders(
                data.CommonPrefixes.map(_ => _.Prefix),
                prefix
              ),
              reachEnd: data.IsTruncated === 'true' ? false : true,
              // @ts-ignore
              marker: data.Marker,
            }
            data.Contents.forEach(_ => {
              // 腾讯云在查询带prefix的列表返回值中，列表第一个是 prefix，要删掉
              // 查询 prefix 的时候，要带尾 /
              if (_.Key[_.Key.length - 1] !== '/') {
                list.push({
                  fsize: +_.Size,
                  hash: '',
                  key: _.Key,
                  md5: lodashTrim(_.ETag, '"'),
                  putTime: new Date(_.LastModified).toLocaleString(),
                  mimeType: '', // 腾讯没有 mime+
                  signatureUrl: '',
                })
              }
            })
            if (!isBucketPrivateRead) {
              res({
                success: true,
                data: {
                  ...resData,
                  list,
                },
              })
            } else {
              Promise.all<Promise<resourceListItemWithSignatureUrlType>[]>(
                list.map(_ => {
                  return new Promise((res2, rej2) => {
                    that.cos.getObjectUrl(
                      {
                        Bucket: that.bucket,
                        Region: that.region,
                        Key: _.key,
                        Sign: true,
                        Expires: signatureUrlExpires,
                      },
                      (err2, data2) => {
                        if (err2) {
                          rej2(err2.message)
                        } else {
                          res2({
                            ..._,
                            signatureUrl: data2.Url,
                          })
                        }
                      }
                    )
                  })
                })
              )
                .then(listWithSignatureUrl => {
                  res({
                    success: true,
                    data: {
                      ...resData,
                      list: listWithSignatureUrl,
                    },
                  })
                })
                .catch(e => {
                  console.log('腾讯云签名url生成失败', e)
                  res({
                    success: true,
                    data: {
                      ...resData,
                      list,
                    },
                  })
                })
            }
          }
        }
      )
    })
  }

  public deleteBucketFiles(
    keysList: string[]
  ): Promise<{ success: boolean; data?: 'alldeleted' | 'partdeleted' | 'error'; msg?: string }> {
    return new Promise((res, rej) => {
      this.cos.deleteMultipleObject(
        {
          Bucket: this.bucket,
          Region: this.region,
          Objects: keysList.map(_ => ({
            Key: _,
          })),
        },
        function (err, data) {
          if (err) {
            res({
              success: true,
              data: 'error',
              msg: err.message,
            })
          } else {
            res({
              success: true,
              data: 'alldeleted',
            })
          }
        }
      )
    })
  }

  // 这个接口实际上不需要了
  public getOverviewInfo(): Promise<{
    success: boolean
    data: {
      count: number
      space: number
    }
  }> {
    return new Promise((res, rej) => {
      res({
        success: true,
        data: {
          count: 0,
          space: 0,
        },
      })
    })
  }

  public fetchResourceToBucket(
    url: string,
    key: string
  ): Promise<{
    success: boolean
    msg?: string
  }> {
    return new Promise((res, rej) => {
      res({
        success: false,
        msg: '腾讯云不支持从url上传文件',
      })
    })
  }

  // 移动、重命名单个文件
  public moveBucketFile(keysInfo: { originalKey: string; newKey: string }): Promise<{
    success: boolean
    msg?: string
  }> {
    const that = this
    return new Promise((res, rej) => {
      this.cos.putObjectCopy(
        {
          Bucket: this.bucket,
          Region: this.region,
          Key: keysInfo.newKey,
          CopySource: encodeURI(
            `${that.bucket}.cos.${that.region}.myqcloud.com/${keysInfo.originalKey}`
          ),
        },
        (copyErr, data) => {
          if (copyErr) {
            res({ success: false, msg: '复制阶段出错，' + copyErr.message })
          } else {
            /* 删除a/1.jpg */
            that.cos.deleteObject(
              {
                Bucket: that.bucket,
                Region: that.region,
                Key: keysInfo.originalKey,
              },
              function (deleteErr, data) {
                if (deleteErr) {
                  res({
                    success: false,
                    msg: '删除阶段出错，' + deleteErr.message,
                  })
                } else {
                  res({ success: true })
                }
              }
            )
          }
        }
      )
    })
  }
  // 刷新单个文件
  // https://cloud.tencent.com/document/product/228/37870 刷新接口
  // https://cloud.tencent.com/document/product/228/41956 查询额度
  // https://console.cloud.tencent.com/api/explorer?Product=cdn&Version=2018-06-06&Action=PurgeUrlsCache
  public refreshFiles(fileUrls: string[]): Promise<{
    success: boolean
    msg?: string
    data?: {
      leftCount: number | string // 剩余可刷新余额
    }
  }> {
    return new Promise((res, rej) => {
      this.cdn.PurgeUrlsCache(
        {
          Urls: fileUrls,
          UrlEncode: true,
        },
        (err, data) => {
          if (err) {
            res({
              success: false,
              msg: String(err),
            })
          } else {
            this.cdn.DescribePurgeQuota(null, (err2, data2) => {
              if (err2) {
                res({
                  success: true,
                })
              } else {
                res({
                  success: true,
                  data: {
                    leftCount: `${data2.UrlPurge[0].Area}: ${data2.UrlPurge[0].Available}, ${data2.UrlPurge[1].Area}: ${data2.UrlPurge[1].Available}`,
                  },
                })
              }
            })
          }
        }
      )
    })
  }
  // 刷新目录
  // https://cloud.tencent.com/document/product/228/37871
  public refreshDirs(dirUrls: string[]): Promise<{
    success: boolean
    msg?: string
    data?: {
      leftCount: number | string
    }
  }> {
    return new Promise((res, rej) => {
      this.cdn.PurgePathCache(
        {
          Paths: dirUrls,
          FlushType: 'flush',
          UrlEncode: true,
        },
        (err, data) => {
          if (err) {
            res({
              success: false,
              msg: String(err),
            })
          } else {
            this.cdn.DescribePurgeQuota(null, (err2, data2) => {
              if (err2) {
                res({
                  success: true,
                })
              } else {
                res({
                  success: true,
                  data: {
                    leftCount: `${data2.PathPurge[0].Area}: ${data2.PathPurge[0].Available}, ${data2.PathPurge[1].Area}: ${data2.PathPurge[1].Available}`,
                  },
                })
              }
            })
          }
        }
      )
    })
  }
}

export default Tencent
