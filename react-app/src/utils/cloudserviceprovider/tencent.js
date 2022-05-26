import * as COS from 'cos-js-sdk-v5'
import { message } from 'antd'
import copy from 'copy-text-to-clipboard'
import uploadManager, { registerCancel } from '../../Components/UploadManager'
import { debounce } from '../../utils'
import * as messageCenter from '../messageCenter'
import { store } from '../../store'

const debouncedMessageSuccess = debounce(message.success, 2000, false)
const debouncedMessageError = debounce(message.error, 2000, false)

export function upload({ file, key, resourcePrefix, shouldCopy, shouldShowMsg }) {
  return new Promise((resolve, reject) => {
    messageCenter
      .requestGenerateUploadToken()
      .then(res => {
        if (res.success) {
          const data = JSON.parse(res.data)
          const cos = new COS({
            getAuthorization: function (options, callback) {
              callback({
                TmpSecretId: data.credentials.tmpSecretId,
                TmpSecretKey: data.credentials.tmpSecretKey,
                SecurityToken: data.credentials.sessionToken,
                // 建议返回服务器时间作为签名的开始时间，避免用户浏览器本地时间偏差过大导致签名错误
                StartTime: data.startTime, // 时间戳，单位秒，如：1580000000
                ExpiredTime: data.expiredTime, // 时间戳，单位秒，如：1580000000
              })
            },
          })
          const {
            storageManage: { selectBucketInfo },
          } = store.getState()
          cos.putObject(
            {
              Bucket: selectBucketInfo.bucket,
              Region: selectBucketInfo.region,
              Key: key,
              Body: file,
              onProgress: function (progressData) {
                uploadManager({
                  id: key,
                  fname: file.name,
                  percent: Math.floor((progressData.loaded * 100) / progressData.total),
                  path: file.path,
                })
              },
              // 取消上传
              onTaskReady(taskId) {
                registerCancel({
                  id: key,
                  onCancel: () => {
                    cos.cancelTask(taskId)
                    // 用resolve不用reject是为了防止单个资源上传失败或者取消影响到所有资源的复制及后续操作
                    resolve({}) // 没有上传成功不给 key
                  },
                })
              },
            },
            function (err, data) {
              if (err) {
                resolve({}) // 没有上传成功不给 key
                message.error(`${key} 上传失败 ${String(err)}`)
              } else {
                const targetUrl = `${resourcePrefix}${key}`
                shouldCopy && copy(encodeURI(targetUrl))
                shouldShowMsg && debouncedMessageSuccess('上传成功，已复制到剪切板')
                resolve({
                  key,
                })
              }
            }
          )
        } else {
          message.error('获取上传凭证失败' + res.msg)
          resolve({}) // 没有上传成功不给 key
        }
      })
      .catch(err => {
        message.error('获取上传凭证失败')
        resolve({}) // 没有上传成功不给 key
      })
  })
}
