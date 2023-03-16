import * as path from 'path'
import * as vscode from 'vscode'
import port from './port.dev'

export default function (panel: vscode.WebviewPanel) {
  const serverHost = 'http://localhost'
  const serverPort = port

  const prodCssPath = panel.webview.asWebviewUri(
    vscode.Uri.file(path.resolve(__dirname, '../react-app-dist', 'index.css'))
  )
  const prodJSPath = panel.webview.asWebviewUri(
    vscode.Uri.file(path.resolve(__dirname, '../react-app-dist', 'index.js'))
  )

  console.log('static path', {
    prodCssPath,
    prodJSPath,
  })

  // prod ref https://stackoverflow.com/questions/56182144/vscode-extension-webview-external-html-and-css

  const devHtmlTpl = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module" src="${serverHost}:${serverPort}/@vite/client"></script>
    <script type="module">
      import RefreshRuntime from '${serverHost}:${serverPort}/@react-refresh'
      RefreshRuntime.injectIntoGlobalHook(window)
      window.$RefreshReg$ = () => {}
      window.$RefreshSig$ = () => type => type
      window.__vite_plugin_react_preamble_installed__ = true
    </script>
    <meta charset="UTF-8" />
    <title>云存储管理</title>
  </head>
  <body>
    <div id="root">
    </div>
    <script
      type="module"
      src="${serverHost}:${serverPort}/src/main.jsx"
      nonce="15645643165464"
    ></script>
  </body>
</html>`

  const prodHtmlTpl = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>云存储管理</title>
    <link rel="stylesheet" href="${prodCssPath}">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="${prodJSPath}"></script>
  </body>
</html>
`

  return global.__DEV__ ? devHtmlTpl : prodHtmlTpl
}
