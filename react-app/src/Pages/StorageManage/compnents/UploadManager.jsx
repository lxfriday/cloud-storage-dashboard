import React from 'react'
import { Progress } from 'antd'
import styles from './UploadManager.module.less'

export default function UploadManager({ manager }) {
  // const manager = [
  //   {
  //     fname: 'file1.kpg',
  //     percent: 50,
  //   },
  //   {
  //     fname: 'file2.kpg',
  //     percent: 30,
  //   },
  //   {
  //     fname: 'file3.kpg',
  //     percent: 80,
  //   },
  //   {
  //     fname: 'file4.kpg',
  //     percent: 15,
  //   },
  //   {
  //     fname: 'file5.kpg',
  //     percent: 70,
  //   },
  //   {
  //     fname: 'file6.kpg',
  //     percent: 95.8,
  //   },
  // ]
  return (
    <div className={styles.wrapper}>
      {manager.map(fInfo => (
        <div key={fInfo.fname} className={styles.fWrapper}>
          <div className={styles.fname}>{fInfo.fname}</div>
          <div className={styles.progressWrapper}>
            <Progress
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              percent={Math.floor(fInfo.percent)}
              status="active"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
