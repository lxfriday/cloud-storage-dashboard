import { configureStore } from '@reduxjs/toolkit'
import { createLogger } from 'redux-logger'

import settingsReducer from './settings'
import storageManageReducer from './storageManage'

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    storageManage: storageManageReducer,
  },
  middleware: [__DEV__ && createLogger()].filter(m => !!m),
})

// store.subscribe(() => console.log('store.getState', store.getState()))
