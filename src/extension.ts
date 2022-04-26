import * as vscode from 'vscode'
import * as path from 'path'
import htmlTpl from './htmlTpl'
import messageController from './messageController'
import boot from './utils/boot'

let myStatusBarItem: vscode.StatusBarItem

export function activate(context: vscode.ExtensionContext) {
  // create a new status bar item that we can now manage
  // 右下角云存储管理快捷入口
  myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  myStatusBarItem.command = 'cloud-storage-dashboard.start'
  context.subscriptions.push(myStatusBarItem)
  myStatusBarItem.text = '☁️云存储管理'
  myStatusBarItem.show()

  // 扩展配置相关
  boot()

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

    panel.iconPath = vscode.Uri.file(path.resolve(__dirname, '../assets/logo_64x64.png'))
    panel.webview.html = htmlTpl
    messageController(panel, context)
  })

  context.subscriptions.push(disposable2)
}

export function deactivate() {}
