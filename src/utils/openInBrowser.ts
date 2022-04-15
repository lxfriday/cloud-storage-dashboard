// 用默认的浏览器打开地址
const openInDefaultBrowser = function (url: string) {
  return new Promise((res, rej) => {
    try {
      const exec = require('child_process').exec
      console.log(process.platform)
      switch (process.platform) {
        case 'darwin':
          exec('open ' + url)
          break
        case 'win32':
          exec('start ' + url)
          break
        default:
          exec('xdg-open', [url])
      }
      res({ success: true })
    } catch {
      res({ success: false })
    }
  })
}

export default openInDefaultBrowser
