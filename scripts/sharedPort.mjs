import * as path from 'path'
import * as fs from 'fs'
import getPort from 'get-port'

// 自动生成一个可用的端口号
// 供 vite dev 和 webpack dev 使用
async function sharedPort() {
  const port = await getPort()
  // extension => /src/port.dev.ts
  fs.writeFileSync(path.resolve(process.cwd(), 'src/port.dev.ts'), `export default ${port}\r\n`)
  // react-app => /react-app/port.dev.js
  fs.writeFileSync(
    path.resolve(process.cwd(), 'react-app/port.dev.js'),
    `module.exports = ${port}\r\n`
  )
}

sharedPort()
