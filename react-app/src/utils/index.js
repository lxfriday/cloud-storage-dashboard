import { v4 as uuidv4 } from 'uuid'

export const vscodeApi = acquireVsCodeApi()

/**
 * 生成图片上传需要的信息
 */
export function generateUploadImgInfo({ file, token, folder }) {
  const ext = file.type.split('/')[1]
  const randomKey = `${Date.now()}_${uuidv4()}`
  return {
    token, //uploadToken为从后端获得的token
    key: `${folder}${randomKey}.${ext}`,
  }
}
