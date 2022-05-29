import * as qiniu from './qiniu'
import * as tencent from './tencent'
import * as aliyun from './aliyun'

export default {
  qiniu,
  tencent,
  aliyun,
}

// 存储类型
export const storageClass = {
  qiniu: {
    0: '标准存储',
    1: '低频存储',
    2: '归档存储',
    3: '深度归档存储',
  },
  tencent: {
    STANDARD: '标准存储',
    STANDARD_IA: '低频存储',
    ARCHIVE: '归档存储',
    DEEP_ARCHIVE: '深度归档存储',
  },
  aliyun: {
    Standard: '标准存储',
    Archive: '归档存储',
    ColdArchive: '冷归档',
  },
}
