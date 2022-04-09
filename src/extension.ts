import * as vscode from 'vscode'
import htmlTpl from './htmlTpl'
import { qiniuConfig, Qiniu } from './utils/qiniu'

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('cloud-storage-dashboard.helloWorld', () => {
    vscode.window.showInformationMessage('Hello VSCode!')
  })
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
    const qiniu = new Qiniu({
      ak: qiniuConfig.ak,
      sk: qiniuConfig.sk,
      bucket: qiniuConfig.bucket,
      imgDomain: qiniuConfig.imgDomain,
    })

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
            console.log('list')
            panel.webview.postMessage({
              command: 'getQiniuResourceList',
              data: { list, reachEnd },
            })
            return
        }
      },
      undefined,
      context.subscriptions
    )
  })

  context.subscriptions.push(disposable)
  context.subscriptions.push(disposable2)
}

export function deactivate() {}
