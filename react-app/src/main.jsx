import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import 'antd/dist/antd.css'
import { store } from './store'
import { Provider } from 'react-redux'
import './index.less'
import App from './App'

window.LogR = function (...args) {
  if (__DEV__) {
    console.log('%c%s', 'color: red;font-weight:bold;font-size:25px', ...args)
  }
}
window.LogG = function (...args) {
  if (__DEV__) {
    console.log('%c%s', 'color: green;font-weight:bold;font-size:25px', ...args)
  }
}
window.LogO = function (...args) {
  if (__DEV__) {
    console.log('%c%s', 'color: orange;font-weight:bold;font-size:25px', ...args)
  }
}

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>,
  document.getElementById('root')
)
