export type constructorParamsType = {
  ak: string
  sk: string
  bucket: string
  nickname: string
  csp: string
  region: string
}

export type resourceListItemType = {
  fsize: number
  hash: string
  key: string
  md5: string
  putTime: string
  mimeType: string
}

export type resourceListDataType = {
  list: resourceListItemType[]
  commonPrefixes: string[]
  reachEnd: boolean
  marker: string
}

// 依据 prefix 从 commonPrefixes 中分离出当前的 folders
export function extractCurrentFolders(cps: string[], prefix: string) {
  if (!cps) {
    return []
  } else {
    const pfxReg = new RegExp(prefix)
    return cps.map(cp => {
      return cp.replace(pfxReg, '')
    })
  }
}

export abstract class CSPAdaptor {
  constructor(params: constructorParamsType) {}
  public abstract login(cspInfo: {
    csp: string
    ak: string
    sk: string
    nickname: string
  }): Promise<{
    success: boolean
    msg?: string
    data?: any
  }>

  // 生成上传用的token或者其他凭据，data只会是字符串，所有csp上传实现都会该接口生成上传需要的凭据或者key
  // 依据 csp 平台的不同，token可能是直接是一个token字符串，或者是一个 JSON 字符串，返回到前端之后前端依据自己的平台处理，前后端需要对应上
  // qiniu: token字符串
  // tencent：JSON 字符串
  public abstract generateUploadToken(): Promise<{
    success: boolean
    data?: string
    msg?: string
  }>

  public abstract getBucketList(): Promise<{
    success: boolean
    data?: { name: string; region: string; storageClass?: string }[]
    msg?: string
  }>

  public abstract getBucketDomains(): Promise<{ success: boolean; data?: string[]; msg?: string }>

  public abstract getResourceListForSync(marker: string): Promise<{
    success: boolean
    data?: {
      list: Array<any>
      reachEnd: boolean
      marker: string
    }
    msg?: string
  }>

  public abstract getResourceList(
    fromBegin: boolean,
    prefix: string,
    marker: string
  ): Promise<{ success: boolean; data?: resourceListDataType; msg?: string }>

  public abstract deleteBucketFiles(
    keysList: string[]
  ): Promise<{ success: boolean; data?: 'alldeleted' | 'partdeleted' | 'error'; msg?: string }>

  public abstract getOverviewInfo(): Promise<{
    success: boolean
    data: {
      count: number
      space: number
    }
  }>

  public abstract fetchResourceToBucket(
    url: string,
    key: string
  ): Promise<{
    success: boolean
    msg?: string
  }>

  public abstract moveBucketFile(keysInfo: { originalKey: string; newKey: string }): Promise<{
    success: boolean
    msg?: string
  }>

  public abstract refreshFiles(fileUrls: string[]): Promise<{
    success: boolean
    msg?: string
    data?: {
      leftCount: number | string // 剩余可刷新余额
    }
  }>

  public abstract refreshDirs(dirUrls: string[]): Promise<{
    success: boolean
    msg?: string
    data?: {
      leftCount: number | string // 剩余可刷新余额
    }
  }>
}
