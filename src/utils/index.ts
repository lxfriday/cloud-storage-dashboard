import * as vscode from 'vscode'
import * as path from 'path'

// ref https://code.visualstudio.com/api/references/vscode-api#OpenDialogOptions
// ref https://code.visualstudio.com/api/references/vscode-api#vscode.window.showOpenDialog
export function showOpenDialog(options: vscode.OpenDialogOptions) {
  // mac {$mid: 1, path: '/Users/mac/Desktop', scheme: 'file'} process.platform: darwin
  // windows {$mid: 1, path: '/C:/Users/liu32/Desktop/tmp1', scheme: 'file'} process.platform: win32
  // linux
  return vscode.window.showOpenDialog(options).then(res => {
    if (res) {
      if (process.platform === 'win32') {
        // windows 路径比较奇怪，需要去除前导 / ，并且转换成windows可识别的格式
        return res.map(r => path.resolve(r.path.slice(1)))
      } else {
        return res.map(r => r.path)
      }
    } else {
      return res
    }
  })
}

export function getYuanshenBackImg(returnAll = false) {
  const imgs = [
    'https://gitee.com/lxfriday/vscode-osu-mode2/raw/master/images/Character_Diona_Portrait.png',
    'https://gitee.com/lxfriday/vscode-osu-mode2/raw/master/images/Character_Fischl_Portrait.png',
    'https://gitee.com/lxfriday/vscode-osu-mode2/raw/master/images/Character_Ganyu_Portrait.png',
    'https://gitee.com/lxfriday/vscode-osu-mode2/raw/master/images/Character_Hu_Tao_Portrait.png',
    'https://gitee.com/lxfriday/vscode-osu-mode2/raw/master/images/Character_Keqing_Portrait.png',
    'https://gitee.com/lxfriday/vscode-osu-mode2/raw/master/images/Character_Klee_Portrait.png',
    'https://gitee.com/lxfriday/vscode-osu-mode2/raw/master/images/Character_Qiqi_Portrait.png',
  ]
  if (returnAll) {
    return imgs
  } else {
    return imgs[Math.floor(Math.random() * imgs.length)]
  }
}

export function throttle(func: Function, wait: number) {
  let previous = 0
  return function throttled(this: any, ...args: any[]) {
    const ctx = this
    const now = Date.now()
    const remain = wait - (now - previous)
    if (remain <= 0) {
      func.apply(ctx, args)
      previous = now
    }
  }
}

export function debounce(func: Function, wait: number, immediate: boolean = false) {
  let timeout: NodeJS.Timeout | null
  return function debounced(this: any, ...args: any[]) {
    const ctx = this
    if (timeout) clearTimeout(timeout)
    if (immediate) {
      const callNow = !timeout
      timeout = setTimeout(() => {
        timeout = null
      }, wait)
      if (callNow) func.apply(ctx, args)
    } else {
      timeout = setTimeout(() => {
        func.apply(ctx, args)
      }, wait)
    }
  }
}

export function getFullTime(t: Date) {
  // 2017/9/16 09:40:22
  // 补全 时分秒的前导0
  return `${t.getFullYear()}/${t.getMonth() + 1}/${t.getDate()} ${
    t.getHours() < 10 ? `0${t.getHours()}` : t.getHours()
  }:${t.getMinutes() < 10 ? `0${t.getMinutes()}` : t.getMinutes()}:${
    t.getSeconds() < 10 ? `0${t.getSeconds()}` : t.getSeconds()
  }`
}

export function base64ToUrlSafe(v: string) {
  return v.replace(/\//g, '_').replace(/\+/g, '-')
}
export function urlsafeBase64Encode(str: string) {
  const encoded = Buffer.from(str).toString('base64')
  return base64ToUrlSafe(encoded)
}
