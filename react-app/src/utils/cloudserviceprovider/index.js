import * as qiniu from './qiniu'
import * as tencent from './tencent'
import * as aliyun from './aliyun'

export default {
  qiniu,
  tencent,
  aliyun,
}

// 存储类型
export const storageClassMap = {
  qiniu: {
    0: {
      name: '标准存储', // 存储类型中文解释
      canChange: true, // 能否直接变更类型
    },
    1: {
      name: '低频存储',
      canChange: true,
    },
    2: {
      name: '归档存储',
      canChange: false, // 不能直接变更类型，需要解冻
    },
    3: {
      name: '深度归档存储',
      canChange: false,
    },
  },
  tencent: {
    STANDARD: {
      name: '标准存储',
      canChange: true,
    },
    STANDARD_IA: {
      name: '低频存储',
      canChange: true,
    },
    ARCHIVE: {
      name: '归档存储',
      canChange: true,
    },
    DEEP_ARCHIVE: {
      name: '深度归档存储',
      canChange: true,
    },
  },
  aliyun: {
    Standard: {
      name: '标准存储',
      canChange: true,
    },
    Archive: {
      name: '归档存储',
      canChange: false,
    },
    ColdArchive: {
      name: '冷归档',
      canChange: false,
    },
  },
}

export function safelyGetStorageClass(csp, key) {
  let res = {
    name: '无存储类型',
    canChange: false,
  }
  if (storageClassMap[csp] && storageClassMap[csp][key]) {
    res = storageClassMap[csp][key]
  }
  return res
}

// 新增 CORS 规则的时候，提供的默认规则
export const defaultCORSRule = {
  qiniu: {
    allowedMethods: ['GET', 'POST', 'PUT', 'HEAD', 'DELETE'],
    allowedHeaders: '',
    exposeHeaders: '',
    allowedOrigins: '',
    maxAgeSeconds: '0',
  },
  tencent: {
    allowedMethods: ['GET', 'POST', 'PUT', 'HEAD', 'DELETE'],
    allowedHeaders: '*',
    exposeHeaders: 'ETag,Content-Length,x-cos-request-id',
    allowedOrigins: '*',
    maxAgeSeconds: '3600',
  },
  aliyun: {
    allowedMethods: ['GET', 'POST', 'PUT', 'HEAD', 'DELETE'],
    allowedHeaders: '*',
    exposeHeaders: 'etag',
    allowedOrigins: '*',
    maxAgeSeconds: '3600',
  },
}
