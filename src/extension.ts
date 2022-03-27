import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('cloud-storage-dashboard.helloWorld', () => {
    vscode.window.showInformationMessage('Hello VSCode!')
  })

  context.subscriptions.push(disposable)
}

export function deactivate() {}
