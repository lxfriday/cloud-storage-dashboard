/**
 * 文件夹选择器，暂时未使用
 */
import React, { useRef } from 'react'

export default function DirectorySelector({ children }) {
  const inputEle = useRef(null)

  function handleShowExplore() {
    // 每次打开文件选择器之前重置 value，防止选择相同的文件无法触发 onChange 事件
    inputEle.current.value = null
    inputEle.current.click()
  }

  function onChange(e) {
    const { files } = e.target
    // 把设置相对文件夹
    const fileList = [...files]
    console.log('fileList', fileList)
  }

  return (
    <span onClick={handleShowExplore}>
      <input
        ref={inputEle}
        type="file"
        webkitdirectory="true"
        style={{ display: 'none' }}
        onChange={onChange}
        onClick={e => e.stopPropagation()}
      />
      {children}
    </span>
  )
}
