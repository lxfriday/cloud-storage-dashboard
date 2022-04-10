import { configureStore } from '@reduxjs/toolkit'
import counterReducer from './count'

export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
})
