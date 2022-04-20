import { configureStore } from '@reduxjs/toolkit'
import { createLogger } from 'redux-logger'

import settingsReducer from './settings'

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
  },
  middleware: [createLogger()],
})

store.subscribe(() => console.log(store.getState()))
