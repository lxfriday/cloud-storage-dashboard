import { createSlice } from '@reduxjs/toolkit'

const initialSelectBucketInfo = {
  name: '', // 当前的 bucket
  region: '', // bucket 所在的区域
  acl: '', // acl 规则
  isPublicRead: true,
  isPrivateRead: false,
}

const storageManageSlice = createSlice({
  name: 'storageManage',
  initialState: {
    selectBucketInfo: {
      ...initialSelectBucketInfo,
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
      let targetBucket = {
        ...initialSelectBucketInfo,
      }
      state.bucketList.forEach(_ => {
        if (_.name === payload) {
          targetBucket = _
        }
      })
      state.selectBucketInfo = targetBucket
    },
    updateBucketListAction: (state, { payload }) => {
      state.bucketList = payload
    },
    // 重置 bucket 中的信息
    resetBucketInfoAction: state => {
      state.selectBucketInfo = {
        ...initialSelectBucketInfo,
      }
      state.bucketList = []
    },
  },
})

export const { updateBucketAction, updateBucketListAction, resetBucketInfoAction } =
  storageManageSlice.actions

export default storageManageSlice.reducer
