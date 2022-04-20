import { configureStore } from '@reduxjs/toolkit'
import { createLogger } from 'redux-logger'

import settingsReducer from './settings'

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
  },
  middleware: [__DEV__ && createLogger()].filter(m => !!m),
})

store.subscribe(() => console.log(store.getState()))
