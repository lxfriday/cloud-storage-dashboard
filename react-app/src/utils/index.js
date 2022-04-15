import { v4 as uuidv4 } from 'uuid'
import imageExtensions from './fileExtensions/imageExtensions'
import videoExtensions from './fileExtensions/videoExtensions'
import audioExtensions from './fileExtensions/audioExtensions'
import filesize from 'filesize'

export const vscodeApi = acquireVsCodeApi()

// 从 文件名 获取文件的文件名和尾缀
// 情况比较多
// normal => test.png
// 其他情况 [a.b.c.e.png, fname, fnda...f.png,]
// 异常情况比较多，全部归一处理
// 1. 无尾缀的就无畏缀
// 2. 多 . 的文件，依据 . 拆分之后，最后一个 . 作为分割点
export function getResourceExtAndName(fileName) {
  const fnSplit = fileName.split('.')
  if (fnSplit.length === 1) {
    // 无尾缀
    return {
      fname: fnSplit[0],
      ext: '',
    }
  } else if (fnSplit.length === 2) {
    // 正常情况
    return {
      fname: fnSplit[0],
      ext: fnSplit[1],
    }
  } else {
    // 多个点的情况
    const ext = fnSplit.pop()
    const fname = fnSplit.join('.')
    return {
      ext,
      fname,
    }
  }
}

// 上传时用，生成随机的资源名，不带后缀
export function generateRandomResourceName(file, useOriginalFileName = false) {
  const { fname, ext } = getResourceExtAndName(file.name)
  if (useOriginalFileName) {
    return `${fname}_${Date.now()}_${uuidv4()}.${ext}`
  } else {
    return `${Date.now()}_${uuidv4()}.${ext}`
  }
}

/**
 * 生成图片上传需要的信息
 */
export function generateUploadImgInfo({ file, token, folder, remainFileName }) {
  const { ext, fname: fileName } = getResourceExtAndName(file.name)

  let randomKey = `${Date.now()}_${uuidv4()}`
  if (remainFileName) {
    randomKey = `${fileName}_${randomKey}`
  }
  let key = ''
  if (ext && ext.length) {
    key = `${folder}${randomKey}.${ext}`
  } else {
    key = `${folder}${randomKey}`
  }
  return {
    token, //uploadToken为从后端获得的token
    key,
  }
}

// 依据后缀名判断是不是图片
export function isImage(ext) {
  return imageExtensions.includes(ext)
}

// 依据后缀名判断是不是视频
export function isVideo(ext) {
  return videoExtensions.includes(ext)
}

// 依据后缀名判断是不是音频
export function isAudio(ext) {
  return audioExtensions.includes(ext)
}

// 依据后缀名判断是不是gif
export function isGif(ext) {
  return 'gif' === ext
}

// 依据后缀判断是不是 svg
export function isSvg(ext) {
  return 'svg' === ext
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
  return filesize(size, { base: 2 })
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
