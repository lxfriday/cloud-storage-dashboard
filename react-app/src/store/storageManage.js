import { createSlice } from '@reduxjs/toolkit'

const storageManageSlice = createSlice({
  name: 'storageManage',
  initialState: {
    bucket: '', // 当前的 bucket
  },
  reducers: {
    // 更新某一个设置
    updateBucketAction: (state, { payload }) => {
      state.bucket = payload
    },
  },
})

export const { updateBucketAction } = storageManageSlice.actions

export default storageManageSlice.reducer
