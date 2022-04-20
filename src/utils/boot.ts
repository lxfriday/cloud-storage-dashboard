/**
 * 启动webpage需要在本地做一些事
 * 初始化基本配置
 * 创建扩展专属文件夹，添加扩展的配置文件
 * 如果文件夹不存在则创建，如果配置文件不存在则创建
 */
import * as path from 'path'
import * as fs from 'fs'
import * as utils from './index'

let homePath = ''
if (process.platform === 'win32') {
  homePath = String(process.env.USERPROFILE)
} else {
  homePath = String(process.env.HOME)
}

const extFolderName = '.vscode-cloud-storage-dashboard' // 扩展相关的文件存储的文件夹名
const extSettingFileName = 'settings.json' // 配置文件
const extPath = path.join(homePath, extFolderName) // 扩展文件夹绝对路径
const settingsPath = path.join(extPath, extSettingFileName) // 配置文件绝对路径

const resetNeededBaseSettings = {
  forceHTTPS: false, // 使用 https
  uploadUseOrignalFileName: false, // 上传时使用原文件名
  deleteWithoutConfirm: false, // 删除时不需要确认
  copyFormat: 'url', // 复制到剪切板的格式，url或者 markdown img
  imagePreviewSuffix: '?imageView2/1/w/85/h/85/format/webp/q/10', // 文件预览后缀
  downloadDir: '', // 文件下载的目录
  customBackImgs: utils.getYuanshenBackImg(true), // 自定义右下角背景图
}

const cspSettings = {
  // 当前正在使用的供应商
  // currentCSP: {
  //   csp: '',
  //   ak: '',
  //   sk: '',
  // },
  currentCSP: null,
  // 已经登录了的 CSP 信息，可以供用户直接一键切换
  usedCSPs: [
    // {
    //   csp: '',
    //   ak: '',
    //   sk: '',
    // }, // ...
  ],
}

const baseSettings = {
  ...resetNeededBaseSettings,
  ...cspSettings,
}

export default function boot() {
  if (!fs.existsSync(extPath)) {
    fs.mkdirSync(extPath)
  }
  if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(settingsPath, JSON.stringify(baseSettings, null, 2))
  }
  const oldSettings = JSON.parse(fs.readFileSync(settingsPath).toString())
  // 把设置进行合并，防止新加入的配置在配置文件中不存在
  const newSettings = {
    ...baseSettings,
    ...oldSettings,
  }
  fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2))
}

export function getSettings() {
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath).toString())
    return {
      success: true,
      settings,
    }
  } catch (e) {
    return {
      success: false,
      msg: String(e),
    }
  }
}

// 新设置传过来可能只有部分设置
export function updateSettings(newSettings: typeof baseSettings) {
  try {
    const oldSettings = JSON.parse(fs.readFileSync(settingsPath).toString())

    const settings = {
      ...oldSettings,
      ...newSettings,
    }
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
    return { success: true, settings }
  } catch (e) {
    return {
      success: false,
      msg: String(e),
    }
  }
}

// 重置通用设置
// 重置配置信息，覆盖成初始状态，有几项不能重置
// ak sk csp 不重置
export function resetSettings() {
  try {
    const oldSettings = JSON.parse(fs.readFileSync(settingsPath).toString())
    const settings = {
      ...oldSettings,
      ...resetNeededBaseSettings,
    }
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
    return { success: true, settings }
  } catch (e) {
    return {
      success: false,
      msg: String(e),
    }
  }
}
