import * as vscode from 'vscode'
import cspAdaptor from './utils/cspAdaptor'
import MESSAGE_COMMANDS from './messageCommands'
import open from './utils/open'
import * as fsManager from './utils/fsManager'
import * as utils from './utils'
import * as boot from './utils/boot'
import * as downloadManager from './utils/downloadManager'
import syncBucket, { searchFile } from './utils/syncBucket'

export default function messageController(
  panel: vscode.WebviewPanel,
  context: vscode.ExtensionContext
) {
  const postMessage = (msg: any, hideLog?: boolean) => {
    panel.webview.postMessage(msg)
    global.__DEV__ && !hideLog && console.log('server send message', msg)
  }

  panel.webview.onDidReceiveMessage(
    async message => {
      try {
        global.__DEV__ && console.log('server receive message', message)

        switch (message.command) {
          case MESSAGE_COMMANDS.deleteUsedCSP: {
            const deleteUsedCSPRes = await boot.deleteUsedCSP(message.data)
            postMessage({
              uniqueId: message.uniqueId,
              data: deleteUsedCSPRes,
            })
            return
          }

          case MESSAGE_COMMANDS.login: {
            const csp = cspAdaptor(message.cspInfo)
            const loginRes = await csp.login(message.data)
            postMessage({
              uniqueId: message.uniqueId,
              data: loginRes,
            })
            return
          }

          case MESSAGE_COMMANDS.getSettings: {
            const getSettingsRes = boot.getSettings()
            postMessage({
              uniqueId: message.uniqueId,
              data: getSettingsRes,
            })
            return
          }

          case MESSAGE_COMMANDS.updateSettings: {
            const updateSettingsRes = boot.updateSettings(message.data.newSettings)
            postMessage({
              uniqueId: message.uniqueId,
              data: updateSettingsRes,
            })
            return
          }
          case MESSAGE_COMMANDS.resetSettings: {
            const resetSettingsRes = boot.resetSettings()
            postMessage({
              uniqueId: message.uniqueId,
              data: resetSettingsRes,
            })
            return
          }
          case MESSAGE_COMMANDS.readPaths: {
            const readPathsResult = await fsManager.readPaths(message.data.paths)
            postMessage({
              uniqueId: message.uniqueId,
              data: { readPathsResult },
            })
            return
          }
          case MESSAGE_COMMANDS.open: {
            const openResult = await open(message.data.target)
            postMessage({
              uniqueId: message.uniqueId,
              data: {
                ...openResult,
              },
            })
            return
          }
          case MESSAGE_COMMANDS.generateUploadToken: {
            const csp = cspAdaptor(message.cspInfo)
            const generateUploadTokenRes = await csp.generateUploadToken()
            postMessage({
              data: generateUploadTokenRes,
              uniqueId: message.uniqueId,
            })
            return
          }
          case MESSAGE_COMMANDS.getBucketList: {
            const csp = cspAdaptor(message.cspInfo)
            const bucketList = await csp.getBucketList()
            postMessage({
              data: bucketList,
              uniqueId: message.uniqueId,
            })
            return
          }
          case MESSAGE_COMMANDS.getResourceList: {
            const csp = cspAdaptor(message.cspInfo)
            const getResourceListRes = await csp.getResourceList(
              message.data.fromBegin,
              message.data.prefix,
              message.data.marker,
              message.data.isBucketPrivateRead,
              message.data.domain
            )
            postMessage({
              uniqueId: message.uniqueId,
              data: getResourceListRes,
            })
            return
          }
          case MESSAGE_COMMANDS.getSignatureUrl: {
            const csp = cspAdaptor(message.cspInfo)
            const getSignatureUrlRes = await csp.getSignatureUrl(
              message.data.keys,
              message.data.domain,
              message.data.expires
            )
            postMessage({
              uniqueId: message.uniqueId,
              data: getSignatureUrlRes,
            })
            return
          }
          case MESSAGE_COMMANDS.getBucketDomains: {
            const csp = cspAdaptor(message.cspInfo)
            const domains = await csp.getBucketDomains()
            postMessage({
              uniqueId: message.uniqueId,
              data: domains,
            })
            return
          }
          case MESSAGE_COMMANDS.deleteBucketFiles: {
            const csp = cspAdaptor(message.cspInfo)
            const res = await csp.deleteBucketFiles(message.data.keysList)
            postMessage({
              uniqueId: message.uniqueId,
              data: res,
            })
            return
          }
          case MESSAGE_COMMANDS.moveBucketFile: {
            const csp = cspAdaptor(message.cspInfo)
            const moveBucketFileRes = await csp.moveBucketFile(message.data.keysInfo)
            postMessage({
              uniqueId: message.uniqueId,
              data: moveBucketFileRes,
            })
            return
          }
          case MESSAGE_COMMANDS.getOverviewInfo: {
            const csp = cspAdaptor(message.cspInfo)
            const overviewInfo = await csp.getOverviewInfo()
            postMessage({
              uniqueId: message.uniqueId,
              data: overviewInfo,
            })
            return
          }
          case MESSAGE_COMMANDS.fetchResourceToBucket: {
            const csp = cspAdaptor(message.cspInfo)
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
          }
          case MESSAGE_COMMANDS.refreshFiles: {
            const csp = cspAdaptor(message.cspInfo)
            const refreshFilesRes = await csp.refreshFiles(message.data.fileUrls)
            postMessage({
              uniqueId: message.uniqueId,
              data: refreshFilesRes,
            })
            return
          }
          case MESSAGE_COMMANDS.refreshDirs: {
            const csp = cspAdaptor(message.cspInfo)
            const refreshDirsRes = await csp.refreshDirs(message.data.dirUrls)
            postMessage({
              uniqueId: message.uniqueId,
              data: refreshDirsRes,
            })
            return
          }
          case MESSAGE_COMMANDS.showOpenDialog: {
            const showOpenDialogRes = await utils.showOpenDialog(message.data)
            postMessage({
              uniqueId: message.uniqueId,
              data: showOpenDialogRes,
            })
            return
          }
          case MESSAGE_COMMANDS.downloadFiles: {
            downloadManager.manager(message.data.filesInfo, message.data.downloadDir, postMessage)
            postMessage({
              uniqueId: message.uniqueId,
            })
            return
          }
          case MESSAGE_COMMANDS.downloadManager_cancel: {
            downloadManager.onReceiveCancelMessage(message.data.id, postMessage)
            postMessage({
              uniqueId: message.uniqueId,
            })
            return
          }
          case MESSAGE_COMMANDS.syncBucket: {
            const csp = cspAdaptor(message.cspInfo)
            postMessage({
              uniqueId: message.uniqueId,
            })
            syncBucket(csp, postMessage, message.data.forceSync)
            return
          }
          case MESSAGE_COMMANDS.syncBucket_searchFile: {
            const csp = cspAdaptor(message.cspInfo)
            const res = await searchFile(
              csp,
              message.data.keyword,
              message.data.domain,
              message.data.isBucketPrivateRead
            )

            postMessage({
              uniqueId: message.uniqueId,
              data: res,
            })
            return
          }
        }
      } catch (e) {
        vscode.window.showErrorMessage(`extension 出现了错误 ${String(e)}`)
      }
    },
    undefined,
    context.subscriptions
  )
}
