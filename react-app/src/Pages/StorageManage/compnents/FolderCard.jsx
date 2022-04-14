import React from 'react'
import { FolderFilled, RollbackOutlined } from '@ant-design/icons'
import styles from './FolderCard.module.less'

export default function FolderCard({ folderName, handleClick, isBackward }) {
  // 文件夹显示的时候去除尾部 /
  const trimmedFolderName = folderName.slice(0, -1)
  return (
    <div
      className={styles.wrapper}
      onClick={handleClick}
      title={isBackward ? '返回上一层' : '进入文件夹'}
    >
      <div className={styles.iconWrapper}>
        {isBackward ? (
          <RollbackOutlined style={{ color: '#aaa', fontSize: '50px' }} />
        ) : (
          <FolderFilled style={{ color: '#aaa', fontSize: '60px' }} />
        )}
      </div>
      <div className={styles.fileFullName}>{trimmedFolderName}</div>
    </div>
  )
}
