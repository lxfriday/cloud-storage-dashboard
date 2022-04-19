import React, { useEffect, useRef } from 'react'
import { Switch } from 'antd'

import styles from './index.module.less'

export default function Settings() {
  useEffect(() => {}, [])
  return (
    <div className={styles.wrapper}>
      <div className={styles.itemWrapper}>
        开启 HTTPS
        <Switch defaultChecked onChange={null} />
      </div>
    </div>
  )
}
