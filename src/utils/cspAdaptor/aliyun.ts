// aliyun cdn https://www.npmjs.com/package/@alicloud/cdn20180510
// cdn demo https://next.api.aliyun.com/api/Cdn/2018-05-10/DescribeUserDomains?lang=TYPESCRIPT&params={}&tab=DEMO
// aliyun oss https://www.npmjs.com/package/ali-oss
import * as OSS from 'ali-oss'
import Cdn20180510, * as $Cdn20180510 from '@alicloud/cdn20180510'
// 依赖的模块可通过下载工程中的模块依赖文件或右上角的获取 SDK 依赖信息查看
import OpenApi, * as $OpenApi from '@alicloud/openapi-client'
import Util, * as $Util from '@alicloud/tea-util'
// @ts-ignore
import * as lodashTrim from 'lodash.trim'
import * as boot from '../boot'

import {
  constructorParamsType,
  resourceListItemType,
  resourceListItemWithSignatureUrlType,
  resourceListDataType,
  CSPAdaptor,
  extractCurrentFolders,
  signatureUrlExpires,
  aliyunStorageClass,
  corsListItemType,
  putCORSRulesListItemType,
} from './cspAdaptor.common'

export default class Aliyun extends CSPAdaptor {
  oss: OSS
  cdn: Cdn20180510
  accessKeyId: string
  accessKeySecret: string
  bucket: string
  region: string
  constructor(params: constructorParamsType) {
    super(params)
    this.oss = new OSS({
      // 没传就给一个默认值，方便getBucketList获取到所有的bucket信息
      region: !!params.region ? params.region : 'oss-cn-hangzhou',
      accessKeyId: params.ak,
      accessKeySecret: params.sk,
      bucket: params.bucket,
    })
    this.cdn = new Cdn20180510(
      new $OpenApi.Config({
        accessKeyId: params.ak,
        accessKeySecret: params.sk,
        endpoint: 'cdn.aliyuncs.com',
      })
    )
    this.accessKeyId = params.ak
    this.accessKeySecret = params.sk
    this.bucket = params.bucket
    this.region = !!params.region ? params.region : 'oss-cn-hangzhou'
  }

  public async login(cspInfo: { csp: string; ak: string; sk: string; nickname: string }): Promise<{
    success: boolean
    msg?: string
    data?: any
  }> {
    try {
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
    } catch (e) {
      return { success: false, msg: String(e) }
    }
  }

  // https://help.aliyun.com/document_detail/32077.html
  public async generateUploadToken(): Promise<{
    success: boolean
    data?: string
    msg?: string
  }> {
    try {
      return {
        success: true,
        data: JSON.stringify({
          region: this.region,
          accessKeyId: this.accessKeyId,
          accessKeySecret: this.accessKeySecret,
          bucket: this.bucket,
        }),
      }
    } catch (e) {
      return { success: false, msg: String(e) }
    }
  }

  // https://next.api.aliyun.com/api/Oss/2019-05-17/GetBucketAcl?lang=JAVA&sdkStyle=dara&params={%22bucket%22:%22yuny-storage%22}&tab=DEBUG
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
      that.oss
        .listBuckets({})
        .then(result => {
          const buckets: {
            name: string
            region: string
            acl: string
            isPrivateRead: boolean
            isPublicRead: boolean
            // @ts-ignore
          }[] = result.buckets.map(_ => ({
            name: _.name,
            region: _.region,
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
                    const timer = setTimeout(() => {
                      // 设置一个超时时间，防止一直卡在这，只有阿里云有这个问题
                      reject('getBucketACL 超时了')
                    }, 5000)
                    new OSS({
                      // 没传就给一个默认值，方便getBucketList获取到所有的bucket信息
                      region: _.region,
                      accessKeyId: that.accessKeyId,
                      accessKeySecret: that.accessKeySecret,
                      bucket: _.name,
                    })
                      .getBucketACL(_.name)
                      .then(getBucketACLRes => {
                        clearTimeout(timer)
                        resolve({
                          name: _.name,
                          region: _.region,
                          acl: getBucketACLRes.acl,
                          isPrivateRead: getBucketACLRes.acl.includes('private'),
                          isPublicRead: getBucketACLRes.acl.includes('public-read'),
                        })
                      })
                      .catch(e => {
                        reject(e)
                      })
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
                console.log('获取bucket访问权限失败，不返回 ACL 信息', e)
                res({
                  success: true,
                  data: buckets,
                })
              })
          }
        })
        .catch(e => {
          res({ success: false, msg: String(e) })
        })
    })
  }

  // public getBucketInfo(): Promise<{
  //   success: boolean
  //   data?: { name: string; region: string }[]
  //   msg?: string
  // }> {
  //   return new Promise(async (res, rej) => {
  //     try {
  //       const result = await this.oss.getBucketInfo(this.bucket)
  //       console.log('getBucketInfo', result)
  //       res({
  //         success: true,
  //       })
  //     } catch (e) {
  //       res({ success: false, msg: String(e) })
  //     }
  //   })
  // }

  public async getBucketDomains(): Promise<{ success: boolean; data?: string[]; msg?: string }> {
    try {
      await this.getBucketCORS()
      // 默认域名
      const domains = [`${this.bucket}.${this.region}.aliyuncs.com`]
      // 从cdn获取域名
      let describeUserDomainsRequest = new $Cdn20180510.DescribeUserDomainsRequest({})
      let runtime = new $Util.RuntimeOptions({})
      const result = await this.cdn.describeUserDomainsWithOptions(
        describeUserDomainsRequest,
        runtime
      )
      result.body.domains &&
        result.body.domains.pageData &&
        result.body.domains.pageData.forEach(_ => {
          _.domainName && domains.push(_.domainName)
        })
      return {
        success: true,
        data: domains,
      }
    } catch (e) {
      return { success: false, msg: String(e) }
    }
  }

  public async getResourceListForSync(marker: string): Promise<{
    success: boolean
    data?: {
      list: Array<any>
      reachEnd: boolean
      marker: string
    }
    msg?: string
  }> {
    try {
      const result = await this.oss.list(
        {
          'max-keys': 1000,
          prefix: '',
          marker,
        },
        {}
      )
      const list: resourceListItemType[] = []
      result.objects.forEach(_ => {
        // 避免把目录名也拉进来
        if (_.name[_.name.length - 1] !== '/') {
          list.push({
            fsize: +_.size,
            hash: '',
            key: _.name,
            md5: lodashTrim(_.etag, '"'),
            putTime: new Date(_.lastModified).toLocaleString(),
            mimeType: '', // 腾讯没有 mime
            storageClass: _.storageClass as aliyunStorageClass,
          })
        }
      })
      return {
        success: true,
        data: {
          list,
          marker: result.nextMarker ? result.nextMarker : '',
          reachEnd: result.isTruncated ? false : true,
        },
      }
    } catch (e) {
      return { success: false, msg: String(e) }
    }
  }

  public async getSignatureUrl(
    keys: string[],
    domain: string,
    expires: number
  ): Promise<{ success: boolean; data?: string[]; msg?: string }> {
    try {
      const urls = keys.map(_ => this.oss.signatureUrl(_, { expires: expires }))
      return {
        success: true,
        data: urls,
      }
    } catch (e) {
      return {
        success: false,
        msg: String(e),
      }
    }
  }

  // https://help.aliyun.com/document_detail/111389.html
  public async getResourceList(
    fromBegin: boolean,
    prefix: string,
    marker: string,
    isBucketPrivateRead: boolean,
    domain: string
  ): Promise<{ success: boolean; data?: resourceListDataType; msg?: string }> {
    const that = this
    try {
      const result = await that.oss.list(
        {
          'max-keys': 1000,
          prefix,
          delimiter: '/',
          marker,
        },
        {}
      )
      const list: resourceListItemWithSignatureUrlType[] = []
      result.objects.forEach(_ => {
        // 避免把目录名也拉进来
        if (_.name[_.name.length - 1] !== '/') {
          list.push({
            fsize: +_.size,
            hash: '',
            key: _.name,
            md5: lodashTrim(_.etag, '"'),
            putTime: new Date(_.lastModified).toLocaleString(),
            mimeType: '', // 腾讯没有 mime
            signatureUrl: isBucketPrivateRead
              ? that.oss.signatureUrl(_.name, { expires: signatureUrlExpires })
              : '',
            storageClass: _.storageClass as aliyunStorageClass,
          })
        }
      })
      return {
        success: true,
        data: {
          list,
          marker: result.nextMarker ? result.nextMarker : '',
          reachEnd: result.isTruncated ? false : true,
          commonPrefixes: result.prefixes ? extractCurrentFolders(result.prefixes, prefix) : [],
        },
      }
    } catch (e) {
      return { success: false, msg: String(e) }
    }
  }

  public async updateStorageClass(
    key: string,
    storageClass: string // 新的存储类型，都是字符串，七牛需要转换为数字
  ): Promise<{ success: boolean; msg?: string }> {
    try {
      const result = await this.oss.copy(key, key, {
        headers: { 'x-oss-storage-class': storageClass },
      })
      return {
        success: true,
      }
    } catch (e) {
      return {
        success: false,
        msg: String(e),
      }
    }
  }

  public async deleteBucketFiles(
    keysList: string[]
  ): Promise<{ success: true; data?: 'alldeleted' | 'partdeleted' | 'error'; msg?: string }> {
    try {
      const result = await this.oss.deleteMulti(keysList)
      return {
        success: true,
        data: 'alldeleted',
      }
    } catch (e) {
      return {
        success: true,
        data: 'error',
        msg: String(e),
      }
    }
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
        msg: '阿里云不支持从url上传文件',
      })
    })
  }

  public async moveBucketFile(keysInfo: { originalKey: string; newKey: string }): Promise<{
    success: boolean
    msg?: string
  }> {
    try {
      await this.oss.copy(keysInfo.newKey, keysInfo.originalKey)
      try {
        await this.oss.delete(keysInfo.originalKey)
      } catch (e) {
        return {
          success: false,
          msg: '删除源文件阶段出错，' + String(e),
        }
      }
      return {
        success: true,
      }
    } catch (e) {
      return {
        success: false,
        msg: '复制阶段出错，' + String(e),
      }
    }
  }

  // https://help.aliyun.com/document_detail/91164.htm?spm=a2c4g.11186623.0.0.5b394233T1ppjn#t156976.html
  // https://next.api.aliyun.com/api/Cdn/2018-05-10/RefreshObjectCaches?lang=TYPESCRIPT&params={}&tab=DEMO&sdkStyle=dara
  public async refreshFiles(fileUrls: string[]): Promise<{
    success: boolean
    msg?: string
    data?: {
      leftCount: number | string // 剩余可刷新余额
    }
  }> {
    try {
      // 进行刷新任务
      let refreshObjectCachesRequest = new $Cdn20180510.RefreshObjectCachesRequest({
        objectPath: fileUrls.join('\n'),
        objectType: 'File',
      })
      let runtime = new $Util.RuntimeOptions({})
      await this.cdn.refreshObjectCachesWithOptions(refreshObjectCachesRequest, runtime)
      // 获取刷新额度
      let describeRefreshQuotaRequest = new $Cdn20180510.DescribeRefreshQuotaRequest({})
      const quotaRes = await this.cdn.describeRefreshQuotaWithOptions(
        describeRefreshQuotaRequest,
        runtime
      )
      return {
        success: true,
        data: {
          leftCount: !!quotaRes.body.urlRemain ? quotaRes.body.urlRemain : '未查询到',
        },
      }
    } catch (e) {
      return { success: false, msg: String(e) }
    }
  }

  // https://help.aliyun.com/document_detail/91164.htm?spm=a2c4g.11186623.0.0.5b394233T1ppjn#t156976.html
  // https://next.api.aliyun.com/api/Cdn/2018-05-10/RefreshObjectCaches?lang=TYPESCRIPT&params={}&tab=DEMO&sdkStyle=dara
  public async refreshDirs(dirUrls: string[]): Promise<{
    success: boolean
    msg?: string
    data?: {
      leftCount: number | string // 剩余可刷新余额
    }
  }> {
    try {
      // 进行刷新任务
      let refreshObjectCachesRequest = new $Cdn20180510.RefreshObjectCachesRequest({
        objectPath: dirUrls.join('\n'),
        objectType: 'Directory',
      })
      let runtime = new $Util.RuntimeOptions({})
      await this.cdn.refreshObjectCachesWithOptions(refreshObjectCachesRequest, runtime)
      // 获取刷新额度
      let describeRefreshQuotaRequest = new $Cdn20180510.DescribeRefreshQuotaRequest({})
      const quotaRes = await this.cdn.describeRefreshQuotaWithOptions(
        describeRefreshQuotaRequest,
        runtime
      )
      return {
        success: true,
        data: {
          leftCount: !!quotaRes.body.dirRemain ? quotaRes.body.dirRemain : '未查询到',
        },
      }
    } catch (e) {
      return { success: false, msg: String(e) }
    }
  }

  public async getBucketCORS(): Promise<{
    success: boolean
    msg?: string
    data?: corsListItemType[]
  }> {
    try {
      const bucketRes = await this.oss.getBucketCORS(this.bucket)
      const rules: corsListItemType[] = []
      bucketRes.rules.forEach(_ => {
        rules.push({
          allowedHeaders:
            // 可能是字符串或者数组或者 undifined
            typeof _.allowedHeader === 'object'
              ? _.allowedHeader
              : [_.allowedHeader === undefined ? '' : _.allowedHeader],
          allowedMethods:
            typeof _.allowedMethod === 'object'
              ? _.allowedMethod
              : [_.allowedMethod === undefined ? '' : _.allowedMethod],
          allowedOrigins:
            typeof _.allowedOrigin === 'object'
              ? _.allowedOrigin
              : [_.allowedOrigin === undefined ? '' : _.allowedOrigin],
          exposeHeaders:
            typeof _.exposeHeader === 'object'
              ? _.exposeHeader
              : [_.exposeHeader === undefined ? '' : _.exposeHeader],
          maxAgeSeconds:
            typeof _.maxAgeSeconds === 'object'
              ? _.maxAgeSeconds.join(' ')
              : _.maxAgeSeconds === undefined || _.maxAgeSeconds === ''
              ? '0'
              : _.maxAgeSeconds,
        })
      })
      return {
        success: true,
        data: rules,
      }
    } catch (e) {
      // @ts-ignore
      if (e.name === 'NoSuchCORSConfigurationError') {
        // 没有 CORS 配置
        return {
          success: true,
          data: [],
        }
      } else {
        // 其他错误
        return {
          success: false,
          msg: String(e),
        }
      }
    }
  }

  public async putBucketCORS(rules: putCORSRulesListItemType[]): Promise<{
    success: boolean
    msg?: string
  }> {
    try {
      const putBucketCORSRes = await this.oss.putBucketCORS(
        this.bucket,
        rules.map(_ => ({
          allowedOrigin: _.allowedOrigins,
          // 指定允许的跨域请求方法，支持GET、PUT、DELETE、POST和HEAD方法。
          allowedMethod: _.allowedMethods,
          // 指定允许跨域请求的响应头。建议无特殊情况下将此项设置为通配符星号（*）。
          allowedHeader: _.allowedHeaders,
          // 指定允许用户从应用程序中访问的响应头，例如一个JavaScript的XMLHttpRequest对象。不允许使用通配符星号（*）。
          exposeHeader: _.exposeHeaders,
          // 指定浏览器对特定资源的预取（OPTIONS）请求返回结果的缓存时间，单位为秒。
          maxAgeSeconds: _.maxAgeSeconds,
        }))
      )
      return {
        success: true,
      }
    } catch (e) {
      return {
        success: false,
        msg: String(e),
      }
    }
  }
}
