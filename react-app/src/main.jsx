import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import 'antd/dist/antd.css'
import { store } from './store'
import { Provider } from 'react-redux'
import './index.less'
import App from './App'

window.LogR = function (...args) {
  console.log('%c%s', 'color: red;font-weight:bold;', ...args)
}
window.LogG = function (...args) {
  console.log('%c%s', 'color: green;font-weight:bold;', ...args)
}

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>,
  document.getElementById('root')
)
