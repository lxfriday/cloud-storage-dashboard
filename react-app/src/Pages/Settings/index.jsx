import React, { useEffect, useState } from 'react'
import { Switch, Input, Button, Radio, message } from 'antd'

import * as messageCenter from '../../utils/messageCenter'
import { getYuanshenBackImg } from '../../utils'
import styles from './index.module.less'

export default function Settings() {
  const [settings, setSettings] = useState({
    forceHTTPS: false, // 使用 https
    uploadUseOrignalFileName: false, // 上传时使用原文件名
    deleteWithoutConfirm: false, // 删除时不需要确认
    copyFormat: 'url', // 复制到剪切板的格式，url或者 markdown img
    imagePreviewSuffix: '?imageView2/1/w/85/h/85/format/webp/q/10', // 文件预览后缀
    downloadDir: '', // 文件下载的目录
    customBackImgs: getYuanshenBackImg(true), // 自定义右下角背景图
  })

  // 所有的设置都会走这个函数
  function handleSave({ k, v }) {
    console.log('settings', settings, { k, v })
    messageCenter.requestUpadteSettings({ [k]: v }).then(data => {
      if (data.success) {
        message.success('设置更改成功')
      } else {
        message.error('设置更改失败：' + data.msg)
      }
    })
  }

  // 显示文件夹选择器
  function handleShowDirSelector() {
    messageCenter
      .requestShowOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
      })
      .then(data => {
        // data 为 undefined 表示取消选择，否则会有传过来的数据
        if (data) {
          setSettings({
            ...settings,
            downloadDir: data[0],
          })
          handleSave({ k: 'downloadDir', v: data[0] })
        }
      })
      .catch(e => {
        message.error('选择下载文件夹失败')
      })
  }

  // 保存自定义背景图
  function handleSaveCustomBackImgs() {
    // 去除空字符串
    const backImgs = settings.customBackImgs.filter(url => !!url)
    handleSave({
      k: 'customBackImgs',
      v: backImgs,
    })
  }

  useEffect(() => {
    // 获取到默认的配置
  }, [])
  return (
    <div className={styles.wrapper}>
      <div className={styles.itemWrapper}>
        <span className={styles.noti}>开启 HTTPS</span>
        <Switch
          checked={settings.forceHTTPS}
          onChange={checked => {
            setSettings({
              ...settings,
              forceHTTPS: checked,
            })
            handleSave({
              k: 'forceHTTPS',
              v: checked,
            })
          }}
        />
      </div>
      <div className={styles.itemWrapper}>
        <span className={styles.noti}>
          上传文件时使用原文件名
          <span className={styles.eg}>
            (yes: a.png {'=>'} a_timestamp_uuid.png no: a.png {'=>'} timestamp_uuid.png)
          </span>
        </span>
        <Switch
          checked={settings.uploadUseOrignalFileName}
          onChange={checked => {
            setSettings({
              ...settings,
              uploadUseOrignalFileName: checked,
            })
            handleSave({
              k: 'uploadUseOrignalFileName',
              v: checked,
            })
          }}
        />
      </div>
      <div className={styles.itemWrapper}>
        <span className={styles.noti}>删除文件时不需要确认</span>
        <Switch
          checked={settings.deleteWithoutConfirm}
          onChange={checked => {
            setSettings({
              ...settings,
              deleteWithoutConfirm: checked,
            })
            handleSave({
              k: 'deleteWithoutConfirm',
              v: checked,
            })
          }}
        />
      </div>
      <div className={styles.itemWrapper}>
        <span className={styles.noti}>复制到剪切板的格式</span>
        <Radio.Group
          onChange={e => {
            setSettings({
              ...settings,
              copyFormat: e.target.value,
            })
            handleSave({
              k: 'copyFormat',
              v: e.target.value,
            })
          }}
          value={settings.copyFormat}
        >
          <Radio value="url">url</Radio>
          <Radio value="markdown">markdown(img)</Radio>
        </Radio.Group>
      </div>
      <div className={styles.multiRowItemWrapper}>
        <span className={styles.noti}>
          文件预览后缀
          <span className={styles.eg}>
            (eg: https://domain.com/a.png{settings.imagePreviewSuffix})
          </span>
        </span>
        <div className={styles.bottomWrapper}>
          <Input
            size="small"
            type="text"
            value={settings.imagePreviewSuffix}
            style={{ width: 600 }}
            onChange={e =>
              setSettings({
                ...settings,
                imagePreviewSuffix: e.target.value,
              })
            }
          />
          <Button
            type="primary"
            size="small"
            onClick={() => {
              handleSave({
                k: 'imagePreviewSuffix',
                v: settings.imagePreviewSuffix,
              })
            }}
          >
            保存
          </Button>
        </div>
      </div>
      <div className={styles.multiRowItemWrapper}>
        <span className={styles.noti}>文件下载目录</span>
        <div className={styles.bottomWrapper}>
          <div>{settings.downloadDir}</div>
          <Button type="primary" size="small" onClick={handleShowDirSelector}>
            选择
          </Button>
        </div>
      </div>
      <div className={styles.multiRowItemWrapper} style={{ height: 250 }}>
        <span className={styles.noti}>
          自定义右下角背景图({settings.customBackImgs.filter(u => !!u).length})
          <span className={styles.eg}>(链接使用 , 分隔)</span>
        </span>
        <div className={styles.bottomWrapper}>
          <Input.TextArea
            row={6}
            size="small"
            type="text"
            value={settings.customBackImgs.join('\n')}
            style={{ width: 650, height: 200 }}
            onChange={e => {
              const { value } = e.target
              let newValue = value
              let imgs = []
              // 把换行统一成\n
              if (newValue.includes('\r\n')) {
                newValue = newValue.replace(/\r\n/g, '\n')
              }
              if (newValue.includes('\n\r')) {
                newValue = newValue.replace(/\n\r/g, '\n')
              }
              if (newValue.includes('\r')) {
                newValue = newValue.replace(/\r/g, '\n')
              }
              // imgs = newValue.split('\n').filter(url => !!url)
              imgs = newValue.split('\n')
              // img 可能有空字符串
              setSettings({
                ...settings,
                customBackImgs: imgs,
              })
            }}
          />
          <Button type="primary" size="small" onClick={handleSaveCustomBackImgs}>
            保存
          </Button>
        </div>
      </div>
    </div>
  )
}
