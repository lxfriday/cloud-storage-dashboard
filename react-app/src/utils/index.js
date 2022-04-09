export const vscodeApi = acquireVsCodeApi()

/**
 * 生成图片上传需要的信息
 */
export function generateUploadImgInfo({ file, token, folder }) {
  const ext = file.type.split('/')[1]
  const randomKey = `${Date.now()}_${Math.floor(Math.random() * 10000000)}`
  return {
    token, //uploadToken为从后端获得的token
    key: `${folder}${randomKey}.${ext}`,
  }
}
