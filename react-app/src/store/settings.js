import { createSlice } from '@reduxjs/toolkit'

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    forceHTTPS: false, // 使用 https
    uploadUseOrignalFileName: false, // 上传时使用原文件名
    deleteWithoutConfirm: false, // 删除时不需要确认
    copyFormat: 'url', // 复制到剪切板的格式，url或者 markdown img
    imagePreviewSuffix: '', // 文件预览后缀
    downloadDir: '', // 文件下载的目录
    customBackImgs: [], // 自定义右下角背景图
    csp: '',
    ak: '',
    sk: '',
  },
  reducers: {
    // 更新某一个设置
    updateSettings: (state, { payload }) => {
      state[payload.k] = payload.v
    },
    // 初始化设置
    initSettings: (state, { payload }) => {
      console.log('initSettings', payload)
      Object.keys(payload).forEach(k => (state[k] = payload[k]))
    },
  },
})

export const { updateSettings, initSettings } = settingsSlice.actions

export default settingsSlice.reducer
