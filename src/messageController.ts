import * as vscode from 'vscode'
import cspAdaptor from './utils/cspAdaptor'
import MESSAGE_COMMANDS from './messageCommands'
import globalConfig from './globalConfig'
import openInBrowser from './utils/openInBrowser'
import * as fsManager from './utils/fsManager'
import * as utils from './utils'
import * as boot from './utils/boot'

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
          case MESSAGE_COMMANDS.getSettings:
            const settings = boot.getSettings()
            postMessage({
              uniqueId: message.uniqueId,
              data: settings,
            })
            return
          case MESSAGE_COMMANDS.upadteSettings:
            const updateSettingsRes = boot.updateSettings(message.data.newSettings)
            postMessage({
              uniqueId: message.uniqueId,
              data: updateSettingsRes,
            })
            return
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
          case MESSAGE_COMMANDS.moveBucketFiles:
            const moveBucketFilesRes = await csp.moveBucketFiles(message.data.keysInfoList)
            postMessage({
              uniqueId: message.uniqueId,
              data: moveBucketFilesRes,
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
          case MESSAGE_COMMANDS.fetchResourceToBucket:
            const fetchResourceRsult = await csp.fetchResourceToBucket(
              message.data.url,
              message.data.key
            )
            postMessage({
              uniqueId: message.uniqueId,
              data: {
                ...fetchResourceRsult,
              },
            })
            return
          case MESSAGE_COMMANDS.refreshFiles:
            const refreshFilesRes = await csp.refreshFiles(message.data.fileUrls)
            postMessage({
              uniqueId: message.uniqueId,
              data: refreshFilesRes,
            })
            return
          case MESSAGE_COMMANDS.refreshDirs:
            const refreshDirsRes = await csp.refreshDirs(message.data.dirUrls)
            postMessage({
              uniqueId: message.uniqueId,
              data: refreshDirsRes,
            })
            return
          case MESSAGE_COMMANDS.showOpenDialog:
            const showOpenDialogRes = await utils.showOpenDialog(message.data)
            postMessage({
              uniqueId: message.uniqueId,
              data: showOpenDialogRes,
            })
          // return
        }
      } catch (e) {
        vscode.window.showErrorMessage(`extension 出现了错误 ${String(e)}`)
      }
    },
    undefined,
    context.subscriptions
  )
}
