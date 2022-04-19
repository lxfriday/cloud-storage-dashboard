const path = require('path')
const fs = require('fs')

const p1 = path.resolve('/C:/Users/liu32/Desktop/tmp1')
const p2 = path.resolve('C:/Users/liu32/Desktop/tmp1')

console.log(p1)
console.log(p2)

const dir = fs.readdirSync(p2)
console.log(dir)
console.log(process.platform) // win32
console.log(process.env)

const extFolderName = '.vscode-cloud-storage-dashboard'
const extSettingFileName = 'settings.json'
const extPath = path.join(process.env.HOME, extFolderName)
const settingsPath = path.join(extPath, extSettingFileName)
console.log(extPath)

const baseSettings = {
  a: 1,
  b: 2,
  c: 3,
}

if (!fs.existsSync(extPath)) {
  fs.mkdirSync(extPath)
}
if (!fs.existsSync(settingsPath)) {
  fs.writeFileSync(settingsPath, JSON.stringify(baseSettings, null, 2))
}
