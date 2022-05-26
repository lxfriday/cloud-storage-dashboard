import * as qiniu from 'qiniu-js'
import { message } from 'antd'
import copy from 'copy-text-to-clipboard'
import uploadManager, { registerCancel } from '../../Components/UploadManager'
import { debounce } from '../../utils'
import * as messageCenter from '../messageCenter'

const debouncedMessageSuccess = debounce(message.success, 2000, false)

// https://developer.qiniu.com/kodo/1283/javascript

export function upload({ file, key, resourcePrefix, shouldCopy, shouldShowMsg }) {
  return new Promise((resolve, reject) => {
    messageCenter
      .requestGenerateUploadToken()
      .then(res => {
        if (res.success) {
          // const observable = qiniu.upload(file, key, token)
          const observable = qiniu.upload(file, key, res.data)
          const subscription = observable.subscribe({
            next(res) {
              uploadManager({
                id: key,
                fname: file.name,
                percent: res.total.percent,
                path: file.path,
              })
            },
            error(err) {
              message.error(`${key} 上传失败 ${err.message}`)
              resolve({})
            },
            complete(res) {
              const targetUrl = `${resourcePrefix}${res.key}`
              shouldCopy && copy(encodeURI(targetUrl))
              shouldShowMsg && debouncedMessageSuccess('上传成功，已复制到剪切板')

              resolve({
                key,
              })
            },
          })

          registerCancel({
            id: key,
            onCancel: () => {
              subscription.unsubscribe()
              resolve({})
            },
          })
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
