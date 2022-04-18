import React from 'react'
import { vscodeApi } from './index'
import globalConfig from '../../../src/globalConfig'
import { notification } from 'antd'
import loading from '../Components/Loading'

// server 监听，page 触发，page 发数据，server 收数据，必须指定
// serverCommand: 'requestDataFromServer',

const randomKey = () => `${Date.now()}_${Math.floor(Math.random() * 10000000)}`
export default function messageAdaptor(
  { serverCommand, data },
  showLoading = true, // 是否显示加载效果
  timeout = 10000 // reject 超时时间
) {
  const timeStart = Date.now()
  return new Promise((res, rej) => {
    const uniqueId = randomKey()
    const timer = setTimeout(() => {
      notification.error({
        message: '提示',
        description: (
          <div>
            数据获取超时了 info:
            <div>serverCommand: {serverCommand}</div>
            <div>data: {JSON.stringify(data)}</div>
          </div>
        ),
      })
      rej('数据获取超时了', { serverCommand, data })
    }, timeout)

    //--------------------加载提示-----------------------
    showLoading && loading.show()
    //--------------------------------------------------
    function listener(ev) {
      const msg = ev.data
      if (msg.uniqueId === uniqueId) {
        window.removeEventListener('message', listener)
        clearTimeout(timer)
        globalConfig.showMessageProgress &&
          LogO(`page receive message, time cost: ${Date.now() - timeStart}ms`, { msg })
        showLoading && loading.hide()
        res(msg.data)
      }
    }

    window.addEventListener('message', listener)
    vscodeApi.postMessage({
      command: serverCommand,
      uniqueId,
      data,
    })
    globalConfig.showMessageProgress &&
      LogO('page send message', { command: serverCommand, uniqueId, data })
  })
}

// ------------------------------------------------------------
// export function requestGenerateUploadToken(data) {
//   return messageAdaptor({
//     serverCommand: MESSAGE_COMMANDS.generateUploadToken,
//     data: {
//       ...providerInfo,
//       ...data,
//     },
//   })
// }
