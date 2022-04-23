import * as path from 'path'
import * as vscode from 'vscode'
import port from './port.dev'

console.log('port', port)

const serverHost = 'http://localhost'
const serverPort = port

const prodCssPath = vscode.Uri.file(path.resolve(__dirname, '../react-app-dist', 'index.css')).with(
  {
    scheme: 'vscode-resource',
  }
)
const prodJSPath = vscode.Uri.file(path.resolve(__dirname, '../react-app-dist', 'index.js')).with({
  scheme: 'vscode-resource',
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

export default global.__DEV__ ? devHtmlTpl : prodHtmlTpl
