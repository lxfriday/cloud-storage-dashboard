import { createSlice } from '@reduxjs/toolkit'

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    hasLogin: false,
    forceHTTPS: false, // 使用 https
    uploadUseOrignalFileName: false, // 上传时使用原文件名
    deleteWithoutConfirm: false, // 删除时不需要确认
    enableNotiSyncBucket: true, // 启用bucket同步提示
    copyFormat: 'url', // 复制到剪切板的格式，url或者 markdown img
    imagePreviewSuffix: '', // 文件预览后缀
    downloadDir: '', // 文件下载的目录
    customBackImgs: [], // 自定义右下角背景图
    // 当前正在使用的供应商
    // currentCSP: {
    //   nickname: '',
    //   csp: '',
    //   ak: '',
    //   sk: '',
    // },
    currentCSP: null, // 为 null 表示没有登录过，要进行登录
    // 已经登录了的 CSP 信息，可以供用户直接一键切换
    usedCSPs: [
      // {
      //   nickname: '',
      //   csp: '',
      //   ak: '',
      //   sk: '',
      // }, // ...
    ],
  },
  reducers: {
    // 更新某一个设置
    updateSettings: (state, { payload }) => {
      state[payload.k] = payload.v
    },
    // 初始化设置
    initSettings: (state, { payload }) => {
      Object.keys(payload).forEach(k => (state[k] = payload[k]))
    },
    logout: state => {
      state.hasLogin = false
    },
    setHasLoginTrue: state => {
      state.hasLogin = true
    },
  },
})

export const { updateSettings, initSettings, logout, setHasLoginTrue } = settingsSlice.actions

export default settingsSlice.reducer
