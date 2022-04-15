import React, { useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import DPlayer from 'dplayer'
import styles from './VideoPlayer.module.less'


// 在 vscode 内播放视频，有视频没有声音
// 现在已启用，音视频统一用系统的浏览器打开
function VideoPlayer({ url, handleClose }) {
  const videoEl = useRef(null)

  useEffect(() => {
    const dp = new DPlayer({
      container: videoEl.current,
      video: {
        url,
      },
    })
    return () => {
      dp.destroy()
    }
  }, [])
  return (
    <div className={styles.wrapper}>
      <div className={styles.overlay} onClick={handleClose}></div>
      <div
        ref={videoEl}
        className={styles.video}
        style={{ width: `${document.body.getBoundingClientRect().width - 200}px` }}
      ></div>
    </div>
  )
}

const wrapperEle = document.createElement('div')

const player = {
  isvisible: false,
  show(url) {
    if (!this.isvisible) {
      ReactDOM.render(<VideoPlayer url={url} handleClose={() => this.hide()} />, wrapperEle)
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

export default player
