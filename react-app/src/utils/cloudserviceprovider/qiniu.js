import * as qiniu from 'qiniu-js'
import { message } from 'antd'
import copy from 'copy-text-to-clipboard'
import uploadManager, { registerCancel } from '../../Components/UploadManager'
import { debounce } from '../../utils'

const debouncedMessageSuccess = debounce(message.success, 2000, false)

// https://developer.qiniu.com/kodo/1283/javascript

export function upload({ file, key, token, resourcePrefix, shouldCopy, shouldShowMsg }) {
  return new Promise((resolve, reject) => {
    const observable = qiniu.upload(file, key, token)
    const subscription = observable.subscribe({
      next(res) {
        // ...
        // console.log('upload Progress file', file)
        // console.log('upload Progress percent', res.total.percent)
        uploadManager({
          id: key,
          fname: file.name,
          percent: res.total.percent,
          path: file.path,
        })
      },
      error(err) {
        // ...
        reject({
          hasCancelled: false,
          hasError: true,
          msg: String(err),
        })
      },
      complete(res) {
        const targetUrl = `${resourcePrefix}${res.key}`
        shouldCopy && copy(targetUrl)
        shouldShowMsg && debouncedMessageSuccess('上传成功，已复制到剪切板')

        resolve(res)
      },
    })

    registerCancel({
      id: key,
      onCancel: () => {
        subscription.unsubscribe()
        reject({
          // hasCancelled 为 true 的时候，提醒在 uploadManager 中会调用，不需要针对 hasCancelled 提醒处理
          hasCancelled: true,
          hasError: false,
          msg: `${file.name}停止上传`,
        })
      },
    })
  })
}
