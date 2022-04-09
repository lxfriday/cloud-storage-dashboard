const serverHost = 'http://localhost'
const serverPort = 3001

export default `
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module" src="${serverHost}:${serverPort}/@vite/client"></script>
    <script type="module">
import RefreshRuntime from "${serverHost}:${serverPort}/@react-refresh"
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true
</script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/src/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="${serverHost}:${serverPort}/src/main.jsx"></script>
  </body>
</html>`
