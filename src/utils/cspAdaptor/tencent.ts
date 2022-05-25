import * as COS from 'cos-nodejs-sdk-v5'
import * as tencentcloud from 'tencentcloud-sdk-nodejs'
import { Client } from 'tencentcloud-sdk-nodejs/tencentcloud/services/cdn/v20180606/cdn_client'
// import * as boot from '../boot'
// @ts-ignore
import * as lodashTrim from 'lodash.trim'
import {
  constructorParamsType,
  resourceListItemType,
  resourceListDataType,
  CSPAdaptor,
} from './cspAdaptor.common'

const CdnClient = tencentcloud.cdn.v20180606.Client

class Tencent extends CSPAdaptor {
  cos: COS
  cdn: Client
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
    this.bucket = params.bucket
    this.region = params.region
  }

  public async login(cspInfo: { csp: string; ak: string; sk: string; nickname: string }): Promise<{
    success: boolean
    msg?: string
    data?: any
  }> {
    const res = await this.getBucketList()
    if (!res.success) {
      return {
        success: false,
        msg: '登录失败，请检查密钥',
      }
    }
    return {
      success: true,
      data: {},
    }

    // 把登录信息保存在本地
    // const loginRes = boot.login(cspInfo)
    // return loginRes
  }

  // 腾讯云不走 token
  public async generateUploadToken(): Promise<{
    success: boolean
    data: string
  }> {
    return {
      success: true,
      data: '',
    }
  }

  public getBucketList(): Promise<{
    success: boolean
    data?: { name: string; region: string }[]
    msg?: string
  }> {
    return new Promise((res, rej) => {
      this.cos.getService({}, function (err, data) {
        if (err) {
          res({
            success: false,
            msg: err.message,
          })
        } else {
          res({
            success: true,
            data: data.Buckets.map(_ => ({ name: _.Name, region: _.Location })),
          })
        }
      })
    })
  }

  public async getBucketDomains(): Promise<{ success: boolean; data: string[] }> {
    return {
      success: true,
      data: [`${this.bucket}.cos.${this.region}.myqcloud.com`, `${this.bucket}.file.myqcloud.com`],
    }
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
            console.log(data)
            res({
              success: true,
              data: {
                list: data.Contents.map(_ => ({
                  fsize: +_.Size,
                  hash: '',
                  key: _.Key,
                  md5: lodashTrim(_.ETag, '"'),
                  putTime: _.LastModified,
                  mimeType: '', // 腾讯没有 mime
                })),
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

  // https://cloud.tencent.com/document/product/436/64982
  public getResourceList(
    fromBegin: boolean,
    prefix: string,
    marker: string
  ): Promise<{ success: boolean; data?: resourceListDataType; msg?: string }> {
    return new Promise((res, rej) => {
      this.cos.getBucket(
        {
          Bucket: this.bucket,
          Region: this.region,
          Prefix: prefix,
          Marker: marker,
          // Delimiter = '/' 的时候 commonPrefixes 才会有值
          Delimiter: prefix[prefix.length - 1] === '/' || prefix === '' ? '/' : '',
        },
        function (err, data) {
          if (err) {
            res({
              success: false,
              msg: err.message,
            })
          } else {
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
            const list: resourceListItemType[] = []
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
                commonPrefixes: extractCurrentFolders(data.CommonPrefixes.map(_ => _.Prefix)),
                reachEnd: data.IsTruncated === 'true' ? false : true,
                // @ts-ignore
                marker: data.Marker,
              },
            })
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
    return new Promise((res, rej) => {
      this.cos.putObjectCopy(
        {
          Bucket: this.bucket,
          Region: this.region,
          Key: keysInfo.newKey,
          CopySource: `${this.bucket}.cos.${this.region}.myqcloud.com/${keysInfo.originalKey}`,
        },
        (copyErr, data) => {
          if (copyErr) {
            res({ success: false, msg: '移动、重命名文件失败：复制阶段出错，' + copyErr.message })
          } else {
            /* 删除a/1.jpg */
            this.cos.deleteObject(
              {
                Bucket: this.bucket,
                Region: this.region,
                Key: keysInfo.originalKey,
              },
              function (deleteErr, data) {
                if (deleteErr) {
                  res({
                    success: false,
                    msg: '移动、重命名文件失败：删除阶段出错，' + deleteErr.message,
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
  // https://cloud.tencent.com/document/product/228/37870
  public refreshFiles(fileUrls: string[]): Promise<{
    success: boolean
    msg?: string
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
              msg: '刷新失败：' + err,
            })
          } else {
            res({
              success: true,
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
      leftCount: number
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
              msg: '刷新失败：' + err,
            })
          } else {
            res({
              success: true,
            })
          }
        }
      )
    })
  }
}

export default Tencent