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

export function requestGetQiniuBucketList() {
  vscodeApi.postMessage({
    command: 'getQiniuBucketList',
  })
}
