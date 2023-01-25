import React from 'react'
import ReactDOM from 'react-dom'
import HashLoader from 'react-spinners/HashLoader'
import styles from './Loading.module.less'

function Loading() {
  return (
    <div className={styles.wrapper}>
      <HashLoader size={60} color="#36D7B7" loading />
    </div>
  )
}

const wrapperEle = document.createElement('div')

const loading = {
  isvisible: false,
  show() {
    if (!this.isvisible) {
      ReactDOM.render(<Loading />, wrapperEle)
      document.querySelector('#root').appendChild(wrapperEle)
      this.isvisible = true
    }
  },
  hide() {
    if (this.isvisible) {
      ReactDOM.unmountComponentAtNode(wrapperEle)
      this.isvisible = false
    }
  },
}

export default loading
