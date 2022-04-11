import * as vscode from 'vscode'
import cspAdaptor from './utils/cspAdaptor'
import MESSAGE_COMMANDS from './messageCommands'
import globalConfig from './globalConfig'

export default function messageController(
  panel: vscode.WebviewPanel,
  context: vscode.ExtensionContext
) {
  const postMessage = (msg: any) => {
    panel.webview.postMessage(msg)
    globalConfig.showMessageProgress && console.log('server send message', msg)
  }

  panel.webview.onDidReceiveMessage(
    async message => {
      globalConfig.showMessageProgress && console.log('server receive message', message)
      const csp = cspAdaptor(message.data.providerName)

      switch (message.command) {
        case MESSAGE_COMMANDS.generateUploadToken:
          postMessage({
            data: csp.generateUploadToken(),
            uniqueId: message.uniqueId,
          })
          return
        case MESSAGE_COMMANDS.getBucketList:
          const bucketList = await csp.getBucketList()
          postMessage({
            data: bucketList,
            uniqueId: message.uniqueId,
          })
          return
        case MESSAGE_COMMANDS.getResourceList:
          const { list, reachEnd } = await csp.getResourceList(
            message.data.fromBegin,
            message.data.prefix
          )
          postMessage({
            data: { list, reachEnd },
            uniqueId: message.uniqueId,
          })
          return
        case MESSAGE_COMMANDS.updateBucket:
          csp.updateBucket(message.data.newBucket)
          const domains = await csp.getBucketDomains(message.data.newBucket)
          postMessage({
            uniqueId: message.uniqueId,
            data: domains,
          })
          return
        case MESSAGE_COMMANDS.deleteBucketFiles:
          const res = await csp.deleteBucketFiles(message.data.keysList)
          postMessage({
            uniqueId: message.uniqueId,
            data: res,
          })
          return
        case MESSAGE_COMMANDS.getOverviewInfo:
          const overviewInfo = await csp.getOverviewInfo()
          postMessage({
            uniqueId: message.uniqueId,
            data: overviewInfo,
          })
          return
      }
    },
    undefined,
    context.subscriptions
  )
}
