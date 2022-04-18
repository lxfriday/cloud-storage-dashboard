import React from 'react'
import { FolderFilled, RollbackOutlined } from '@ant-design/icons'
import { Menu, Dropdown } from 'antd'
import classnames from 'classnames'

import styles from './FolderCard.module.less'

let clickCount = 0

export default function FolderCard({
  folderName,
  handleClick,
  isBackward,
  selected,
  handleRefreshDir,
  handleToggleSelectFolder,
}) {
  // 文件夹显示的时候去除尾部 /
  const trimmedFolderName = folderName.slice(0, -1)

  const contextMenu = (
    <Menu>
      <Menu.Divider />
      <Menu.Item key="1" onClick={handleRefreshDir}>
        刷新CDN
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="2" onClick={handleToggleSelectFolder}>
        选择
      </Menu.Item>
      <Menu.Divider />
    </Menu>
  )

  return (
    <Dropdown overlay={contextMenu} trigger={['contextMenu']}>
      <div
        className={classnames(styles.wrapper, selected && styles.selected)}
        onClick={e => {
          if (!isBackward) {
            clickCount += 1
            setTimeout(() => {
              if (clickCount === 1) {
                handleToggleSelectFolder()
              } else if (clickCount === 2) {
                handleClick()
              }
              clickCount = 0
            }, 200)
          } else {
            handleClick()
          }
        }}
        title={isBackward ? '单击返回上一层' : '双击进入文件夹'}
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
    </Dropdown>
  )
}
