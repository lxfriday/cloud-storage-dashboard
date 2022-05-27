import OSS from 'ali-oss'
import { message } from 'antd'
import copy from 'copy-text-to-clipboard'
import uploadManager, { registerCancel } from '../../Components/UploadManager'
import { debounce } from '../../utils'
import * as messageCenter from '../messageCenter'

const debouncedMessageSuccess = debounce(message.success, 2000, false)
const debouncedMessageError = debounce(message.error, 2000, false)

export async function upload({ file, key, resourcePrefix, shouldCopy, shouldShowMsg }) {
  return new Promise((resolve, reject) => {
    messageCenter
      .requestGenerateUploadToken()
      .then(tokenRes => {
        if (tokenRes.success) {
          const data = JSON.parse(tokenRes.data)
          const oss = new OSS({
            region: data.region,
            // 从STS服务获取的临时访问密钥（AccessKey ID和AccessKey Secret）。
            accessKeyId: data.accessKeyId,
            accessKeySecret: data.accessKeySecret,
            bucket: data.bucket,
          })
          let abortCheckpoint
          // 使用的分片上传，别问为什么，问就是普通上传没进度没abort
          oss
            .multipartUpload(key, file, {
              progress(progress, cpt) {
                abortCheckpoint = cpt
                uploadManager({
                  id: key,
                  fname: file.name,
                  percent: Math.floor(progress * 100),
                  path: file.path,
                })
              },
            })
            .then(uploadRes => {
              const targetUrl = `${resourcePrefix}${key}`
              shouldCopy && copy(encodeURI(targetUrl))
              shouldShowMsg && debouncedMessageSuccess('上传成功，已复制到剪切板')
              resolve({ key }) // 没有上传成功不给 key
            })
            .catch(e => {
              if (e.name !== 'cancel') {
                message.error('上传出错 ' + e)
              }
              resolve({})
            })
          registerCancel({
            id: key,
            onCancel: () => {
              oss.abortMultipartUpload(abortCheckpoint.name, abortCheckpoint.uploadId)
            },
          })
        } else {
          console.log(res)
          message.error('获取上传凭证失败 ' + res.msg)
          resolve({}) // 没有上传成功不给 key
        }
      })
      .catch(err => {
        console.log(err)
        message.error('获取上传凭证失败' + err)
        resolve({}) // 没有上传成功不给 key
      })
  })
}
