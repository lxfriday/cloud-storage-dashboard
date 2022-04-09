import { vscodeApi } from './index'

export function requestGenerateQiniuUploadToken() {
  vscodeApi.postMessage({
    command: 'generateQiniuUploadToken',
  })
}

export function requestGetQiniuPublicConfig() {
  vscodeApi.postMessage({
    command: 'getQiniuPublicConfig',
  })
}

export function requestGetQiniuResourceList() {
  vscodeApi.postMessage({
    command: 'getQiniuResourceList',
  })
}

export function requestGetQiniuBucketList() {
  vscodeApi.postMessage({
    command: 'getQiniuBucketList',
  })
}

export function requestUpdateBucket(newBucket) {
  vscodeApi.postMessage({
    command: 'updateBucket',
    data: newBucket,
  })
}

// getBucketDomains
