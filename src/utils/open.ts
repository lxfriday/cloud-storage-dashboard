const open = require('open')

// 可以打开任何合理的地址
// 本地某个文件夹、网页等
// 不会 reject
export default function (target: string) {
  return new Promise<{ success: boolean }>((res, rej) => {
    open(target).then(() => {
      res({ success: true })
    })
  })
}
