/**
 * 启动webpage需要在本地做一些事
 * 初始化基本配置
 * 创建扩展专属文件夹，添加扩展的配置文件
 * 如果文件夹不存在则创建，如果配置文件不存在则创建
 */
import * as path from 'path'
import * as fs from 'fs'
import * as utils from './index'

type copyFormatType = 'url' | 'markdown'

type currentCSPType = {
  nickname: string
  csp: string
  ak: string
  sk: string
}

type baseSettingsType = {
  forceHTTPS: boolean
  uploadUseOrignalFileName: boolean
  deleteWithoutConfirm: boolean
  enableNotiSyncBucket: boolean
  copyFormat: copyFormatType
  imagePreviewSuffix: string
  downloadDir: string
  customBackImgs: string[]

  currentCSP: currentCSPType | null
  usedCSPs: currentCSPType[]
}

type updateSettingsParamsType = {
  forceHTTPS?: boolean
  uploadUseOrignalFileName?: boolean
  deleteWithoutConfirm?: boolean
  enableNotiSyncBucket?: boolean
  copyFormat?: copyFormatType
  imagePreviewSuffix?: string
  downloadDir?: string
  customBackImgs?: string[]

  currentCSP?: currentCSPType | null
  usedCSPs?: currentCSPType[]
}

let homePath = ''
if (process.platform === 'win32') {
  homePath = String(process.env.USERPROFILE)
} else {
  homePath = String(process.env.HOME)
}

const extFolderName = '.vscode-cloud-storage-dashboard' // 扩展相关的文件存储的文件夹名
const extSettingFileName = 'settings.json' // 配置文件

export const extPath = path.join(homePath, extFolderName) // 扩展文件夹绝对路径
export const settingsPath = path.join(extPath, extSettingFileName) // 配置文件绝对路径

const resetNeededBaseSettings = {
  forceHTTPS: false, // 使用 https
  uploadUseOrignalFileName: false, // 上传时使用原文件名
  deleteWithoutConfirm: false, // 删除时不需要确认
  enableNotiSyncBucket: true,
  copyFormat: <copyFormatType>'url', // 复制到剪切板的格式，url或者 markdown img
  imagePreviewSuffix: '?imageView2/1/w/85/h/85/format/webp/q/10', // 文件预览后缀
  downloadDir: '', // 文件下载的目录
  customBackImgs: <string[]>utils.getYuanshenBackImg(true), // 自定义右下角背景图
}

const cspSettings = {
  // 当前正在使用的供应商
  // currentCSP: {
  //   nickname: '',
  //   csp: '',
  //   ak: '',
  //   sk: '',
  // },
  currentCSP: null,
  // 已经登录了的 CSP 信息，可以供用户直接一键切换
  usedCSPs: [
    // {
    //   nickname: '',
    //   csp: '',
    //   ak: '',
    //   sk: '',
    // }, // ...
  ],
}

const baseSettings: baseSettingsType = {
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
    const settings: baseSettingsType = JSON.parse(fs.readFileSync(settingsPath).toString())
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
export function updateSettings(newSettings: updateSettingsParamsType) {
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

// 登录时的配置存储
export function login(cspInfo: currentCSPType) {
  try {
    const oldSettings: baseSettingsType = JSON.parse(fs.readFileSync(settingsPath).toString())
    const newUsedCSPs = []
    for (const _ of oldSettings.usedCSPs) {
      // 如果nickname 相同，但是ak、sk、csp有一个不同，则认为是一个新的登录，而新的登录的nickname重复了，所以登录失败
      if (
        _.nickname === cspInfo.nickname &&
        (_.ak !== cspInfo.ak || _.sk !== cspInfo.sk || _.csp !== cspInfo.csp)
      ) {
        return {
          success: false,
          msg: 'nickname 已存在',
          settings: {},
        }
      }
      // 如果 nickname、ak、sk、csp一模一样，则认为是在已登录中直接登录的
      if (
        !(
          _.nickname === cspInfo.nickname &&
          _.ak === cspInfo.ak &&
          _.sk === cspInfo.sk &&
          _.csp === cspInfo.csp
        )
      ) {
        newUsedCSPs.push(_)
      }
    }

    const currentCSP = {
      ak: cspInfo.ak,
      sk: cspInfo.sk,
      nickname: cspInfo.nickname,
      csp: cspInfo.csp,
    }

    const loginSettings = {
      currentCSP,
      usedCSPs: [...newUsedCSPs, currentCSP],
    }

    const settings = {
      ...oldSettings,
      ...loginSettings,
    }
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
    return {
      success: true,
      settings,
      msg: '',
    }
  } catch (e) {
    return {
      success: false,
      settings: {},
      msg: `保存登录信息失败：${String(e)}`,
    }
  }
}

// 已登录列表中，删除某条记录
export function deleteUsedCSP(cspInfo: currentCSPType) {
  try {
    const oldSettings: baseSettingsType = JSON.parse(fs.readFileSync(settingsPath).toString())
    let currentCSP = oldSettings.currentCSP
    let usedCSPs = oldSettings.usedCSPs
      .map(_ => {
        if (
          _.ak === cspInfo.ak &&
          _.sk === cspInfo.sk &&
          _.csp === cspInfo.csp &&
          _.nickname === cspInfo.nickname
        ) {
          return null
        } else {
          return _
        }
      })
      .filter(_ => !!_)
    if (
      currentCSP?.ak === cspInfo.ak &&
      currentCSP?.sk === cspInfo.sk &&
      currentCSP?.csp === cspInfo.csp &&
      currentCSP?.nickname === cspInfo.nickname
    ) {
      currentCSP = null
    }

    const settings = {
      ...oldSettings,
      currentCSP,
      usedCSPs,
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
