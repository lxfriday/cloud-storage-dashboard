import * as qiniu from 'qiniu-js'
import { message } from 'antd'
import copy from 'copy-text-to-clipboard'

// https://developer.qiniu.com/kodo/1283/javascript

export function upload({ file, key, token, forceHTTPS, imgDomain }) {
  return new Promise((resolve, reject) => {
    const observable = qiniu.upload(file, key, token)
    observable.subscribe({
      next(res) {
        // ...
      },
      error(err) {
        // ...
        message.error('上传失败', err)
        reject(err)
      },
      complete(res) {
        const targetUrl = `${forceHTTPS ? 'https://' : 'http://'}${imgDomain}/${res.key}`
        copy(targetUrl)
        console.log('targetUrl', targetUrl)
        message.success('上传成功，已复制到剪切板')

        resolve(res)
      },
    })
  })
}
