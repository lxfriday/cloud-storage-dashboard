import * as vscode from 'vscode'
import cspAdaptor from './utils/cspAdaptor'
import MESSAGE_COMMANDS from './messageCommands'
import globalConfig from './globalConfig'
import openInBrowser from './utils/openInBrowser'
import * as fsManager from './utils/fsManager'

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
      try {
        globalConfig.showMessageProgress && console.log('server receive message', message)
        const csp = cspAdaptor(message.data.providerName)

        switch (message.command) {
          case MESSAGE_COMMANDS.readPaths:
            const readPathsResult = await fsManager.readPaths(message.data.paths)
            postMessage({
              uniqueId: message.uniqueId,
              data: { readPathsResult },
            })
            return

          case MESSAGE_COMMANDS.openInBrowser:
            const openResult = await openInBrowser(message.data.url)
            postMessage({
              uniqueId: message.uniqueId,
              data: {
                ...openResult,
              },
            })
            return
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
            const { list, reachEnd, commonPrefixes } = await csp.getResourceList(
              message.data.fromBegin,
              message.data.prefix
            )
            postMessage({
              data: { list, reachEnd, commonPrefixes },
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
          case MESSAGE_COMMANDS.serverUploadFiles:
            await csp.uploadFiles(message.data.uploadMeta)
            postMessage({
              uniqueId: message.uniqueId,
              // data: domains,
            })
            return
        }
      } catch (e) {
        vscode.window.showErrorMessage(`extension 出现了错误 ${String(e)}`)
      }
    },
    undefined,
    context.subscriptions
  )
}
