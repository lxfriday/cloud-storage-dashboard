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
