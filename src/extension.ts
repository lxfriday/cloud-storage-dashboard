import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import htmlTpl from './htmlTpl'

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
  })

  context.subscriptions.push(disposable)
  context.subscriptions.push(disposable2)
}

export function deactivate() {}
