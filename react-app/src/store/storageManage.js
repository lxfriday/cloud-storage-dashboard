import { createSlice } from '@reduxjs/toolkit'

const storageManageSlice = createSlice({
  name: 'storageManage',
  initialState: {
    selectBucketInfo: {
      bucket: '', // 当前的 bucket
      region: '', // bucket 所在的区域
    },
    bucketList: [
      // {
      //   name: '',
      //   region: '',
      // },
    ],
  },
  reducers: {
    // 更新某一个设置
    updateBucketAction: (state, { payload }) => {
      let region = ''
      state.bucketList.forEach(_ => {
        if (_.name === payload) {
          region = _.region
        }
      })
      state.selectBucketInfo = {
        bucket: payload,
        region,
      }
    },
    updateBucketListAction: (state, { payload }) => {
      state.bucketList = payload
    },
  },
})

export const { updateBucketAction, updateBucketListAction } = storageManageSlice.actions

export default storageManageSlice.reducer
