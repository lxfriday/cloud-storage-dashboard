import { v4 as uuidv4 } from 'uuid'
import imageExtensions from 'image-extensions'
import filesize from 'filesize'

const imageExtensionsSet = new Set(imageExtensions)

export const vscodeApi = acquireVsCodeApi()

/**
 * 生成图片上传需要的信息
 */
export function generateUploadImgInfo({ file, token, folder, remainFileName }) {
  const ext = file.type.split('/')[1]
  const fileName = file.name.split('.')[0]
  console.log('file', file, fileName)
  let randomKey = `${Date.now()}_${uuidv4()}`
  if (remainFileName) {
    randomKey = fileName + randomKey
  }
  return {
    token, //uploadToken为从后端获得的token
    key: `${folder}${randomKey}.${ext}`,
  }
}

// 依据后缀名判断是不是图片
export function isImage(ext) {
  return imageExtensionsSet.has(ext)
}

// t: Date
export function getFullTime(t) {
  // 2017/9/16 09:40:22
  // 补全 时分秒的前导0
  return `${t.getFullYear()}/${t.getMonth() + 1}/${t.getDate()} ${
    t.getHours() < 10 ? `0${t.getHours()}` : t.getHours()
  }:${t.getMinutes() < 10 ? `0${t.getMinutes()}` : t.getMinutes()}:${
    t.getSeconds() < 10 ? `0${t.getSeconds()}` : t.getSeconds()
  }`
}

export function getFileSize(size) {
  return filesize(size)
}

export function debounce(func, wait, immediate) {
  let timeout
  return function debounced(...args) {
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
