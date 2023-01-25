import React from 'react'
import {
  FolderFilled,
  RollbackOutlined,
  RedoOutlined,
  AppstoreAddOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons'
import { Menu, Dropdown } from 'antd'
import classnames from 'classnames'

import styles from './FolderCard.module.less'

let clickCount = 0

export default function FolderCard({
  isGridCell,
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
    <Menu style={{ borderRadius: 8, boxShadow: '0 0 4px #fff', border: '1px solid #ccc' }}>
      <Menu.Item
        key="0"
        onClick={handleClick}
        icon={<FolderOpenOutlined style={{ color: 'brown', fontSize: 14 }} />}
      >
        进入
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="1"
        onClick={handleRefreshDir}
        icon={<RedoOutlined style={{ color: 'brown', fontSize: 14 }} />}
      >
        刷新CDN
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="2"
        onClick={handleToggleSelectFolder}
        icon={<AppstoreAddOutlined style={{ color: '#8B008B  ', fontSize: 14 }} />}
      >
        选择
      </Menu.Item>
      <Menu.Divider />
    </Menu>
  )

  return (
    <Dropdown overlay={contextMenu} trigger={['contextMenu']}>
      <div
        className={classnames(
          styles.wrapper,
          selected && styles.selected,
          isGridCell ? styles.isGridCell : styles.isListCell
        )}
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
            <RollbackOutlined style={{ color: '#eee', fontSize: isGridCell ? 50 : 16 }} />
          ) : (
            <FolderFilled style={{ color: '#eee', fontSize: isGridCell ? 60 : 18 }} />
          )}
        </div>
        <div className={styles.fileFullName}>{trimmedFolderName}</div>
      </div>
    </Dropdown>
  )
}
