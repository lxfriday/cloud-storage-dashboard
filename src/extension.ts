import * as vscode from 'vscode'
import htmlTpl from './htmlTpl'
import qiniu, { qiniuConfig } from './utils/qiniu'

let myStatusBarItem: vscode.StatusBarItem

export function activate(context: vscode.ExtensionContext) {
  // create a new status bar item that we can now manage
  myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  myStatusBarItem.command = 'cloud-storage-dashboard.start'
  context.subscriptions.push(myStatusBarItem)

  myStatusBarItem.text = '☁️云存储管理'
  myStatusBarItem.show()

  let disposable2 = vscode.commands.registerCommand('cloud-storage-dashboard.start', () => {
    const panel = vscode.window.createWebviewPanel(
      'cloud-storage-dashboard', // Identifies the type of the webview. Used internally
      '云存储管理', // Title of the panel displayed to the user
      vscode.ViewColumn.One, // Editor column to show the new webview panel in.
      { enableScripts: true, retainContextWhenHidden: true } // Webview options. More on these later.
    )

    // // Get path to resource on disk
    // const htmlPathInfo = path.join(context.extensionPath, 'src/public/index.html')
    // panel.webview.html = fs.readFileSync(htmlPathInfo).toString()

    panel.webview.html = htmlTpl

    // ----------------------------------------------------------------------------------------------------------------------

    // ----------------------------------------------------------------------------------------------------------------------

    panel.webview.onDidReceiveMessage(
      async message => {
        // console.log('message', message)
        switch (message.command) {
          case 'generateQiniuUploadToken':
            panel.webview.postMessage({
              command: 'generateQiniuUploadToken',
              data: qiniu.generateQiniuUploadToken(),
            })
            return
          case 'getQiniuPublicConfig':
            panel.webview.postMessage({
              command: 'getQiniuPublicConfig',
              data: {
                bucket: qiniuConfig.bucket,
                imgDomain: qiniuConfig.imgDomain,
              },
            })
            return
          case 'getQiniuBucketList':
            const bucketList = await qiniu.getBucketList()
            panel.webview.postMessage({
              command: 'getQiniuBucketList',
              data: bucketList,
            })
            return
          case 'getQiniuResourceList':
            const { list, reachEnd } = await qiniu.getResourceList()
            panel.webview.postMessage({
              command: 'getQiniuResourceList',
              data: { list, reachEnd },
            })
            return
          case 'updateBucket':
            qiniu.updateBucket(message.data)
            const domains = await qiniu.getBucketDomains(message.data)
            panel.webview.postMessage({
              command: 'getBucketDomains',
              data: domains,
            })
            return
        }
      },
      undefined,
      context.subscriptions
    )
  })

  context.subscriptions.push(disposable2)
}

export function deactivate() {}
