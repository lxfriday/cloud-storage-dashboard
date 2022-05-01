import React from 'react'
import { Button } from 'antd'
import { GithubFilled } from '@ant-design/icons'
import MDEditor from '@uiw/react-md-editor'

import { requestOpen } from '../../utils/messageCenter'
import styles from './index.module.less'
import README from '../../../../README.md?raw'

const openUrls = {
  bilibili: () => requestOpen('https://space.bilibili.com/15445514'),
  github: () => requestOpen('https://github.com/lxfriday'),
}

export default function index() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.mdWrapper}>
        <MDEditor.Markdown source={README}></MDEditor.Markdown>
      </div>
      <div className={styles.sideToolsWrapper}>
        <Button type="dashed" onClick={openUrls.bilibili}>
          📺 云影同学 yunyuv
        </Button>
        <Button type="dashed" style={{ marginTop: 3 }} onClick={openUrls.github}>
          <GithubFilled style={{ fontSize: 15 }} /> 云影同学 yunyuv
        </Button>
      </div>
    </div>
  )
}
