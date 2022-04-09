import React, { Component } from 'react'
import styles from './Nav.module.less'
import { Menu, Button, Upload, message } from 'antd'
import { MailOutlined, SettingOutlined, UploadOutlined } from '@ant-design/icons'
import { NavLink } from 'react-router-dom'
import copy from 'copy-text-to-clipboard'
import { generateUploadImgInfo } from '../utils'
import * as messageCenter from '../utils/messageCenter'

const { SubMenu } = Menu

export default class Nav extends Component {
  constructor() {
    super()
    this.state = {
      qiniuConfig: {
        token: '',
        imgDomain: '',
        bucket: '',
      },
    }
  }
  handleClick = () => {
    console.log('????')
  }
  render() {
    const { children } = this.props
    const { qiniuConfig } = this.state
    const selectFileUploadProps = {
      multiple: true,
      action: 'http://upload.qiniu.com',
      showUploadList: false,
      beforeUpload: () => {
        requestGenerateQiniuUploadToken()
        return true
      },
      headers: {},
      data: file =>
        generateUploadImgInfo({
          token: qiniuConfig.token, //uploadToken为从后端获得的token
          file,
          folder: 'testfolder/',
        }),
      onChange(info) {
        LogR('上传中', info)
        if (info.file.status !== 'uploading') {
          // uploading
          // console.log(info.file, info.fileList)
        }
        if (info.file.status === 'done') {
          // 上传完成
          const targetUrl = `${qiniuConfig.imgDomain}/${info.file.response.key}`
          copy(targetUrl)
          message.success('已经复制到剪切板')
          LogG('targetUrl', targetUrl)
          LogG('上传成功', info)
        } else if (info.file.status === 'error') {
          LogR('上传失败', info)
          message.success('上传失败')
        }
      },
    }

    return (
      <div className={styles.wrapper}>
        <div className={styles.sideWrapper}>
          <div className={styles.siteTitle}>云存储管理</div>
          <Menu
            onClick={this.handleClick}
            style={{ width: 180 }}
            defaultSelectedKeys={['settings']}
            openKeys={['sub1']}
            mode="inline"
            theme="dark"
          >
            <SubMenu key="sub1" icon={<MailOutlined />} title="存储空间">
              <Menu.Item key="storagemanage-storage">
                <NavLink
                  to="/storagemanage?space=storage"
                  className={({ isActive }) => (isActive ? styles.navLinkActive : undefined)}
                >
                  storage
                </NavLink>
              </Menu.Item>
              <Menu.Item key="storagemanage-lxfriday-test">
                <NavLink
                  to="/storagemanage?space=lxfriday-test"
                  className={({ isActive }) => (isActive ? styles.navLinkActive : undefined)}
                >
                  lxfriday-test
                </NavLink>
              </Menu.Item>
            </SubMenu>
            <Menu.Item key="settings" icon={<SettingOutlined />}>
              <NavLink
                to="/settings"
                className={({ isActive }) => (isActive ? styles.navLinkActive : undefined)}
              >
                设置
              </NavLink>
            </Menu.Item>
          </Menu>
        </div>
        <div className={styles.contentWrapper}>
          <div className={styles.navTools}>
            <Upload {...selectFileUploadProps}>
              <Button
                type="dashed"
                title="文件上传(支持多选)"
                icon={<UploadOutlined style={{ fontSize: '20px' }} />}
              ></Button>
            </Upload>
          </div>
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    )
  }

  // 接收七牛上传 token
  handleReceiveGenerateQiniuUploadToken = event => {
    const message = event.data // The JSON data our extension sent
    if (message.command === 'generateQiniuUploadToken') {
      this.setState(prev => ({
        qiniuConfig: {
          ...prev.qiniuConfig,
          token: message.data,
        },
      }))
    }
  }
  // 接收七牛 public config
  handleReceiveGetQiniuPublicConfig = event => {
    const message = event.data // The JSON data our extension sent
    if (message.command === 'getQiniuPublicConfig') {
      this.setState(prev => ({
        qiniuConfig: {
          ...prev.qiniuConfig,
          bucket: message.data.bucket,
          imgDomain: message.data.imgDomain,
        },
      }))
    }
  }
  // 接收七牛 public config
  handleReceiveGetQiniuBucketList = event => {
    const message = event.data // The JSON data our extension sent
    if (message.command === 'getQiniuBucketList') {
      console.log('bucket list in page', message.data)
    }
  }

  componentDidMount() {
    window.addEventListener('message', this.handleReceiveGenerateQiniuUploadToken)
    window.addEventListener('message', this.handleReceiveGetQiniuPublicConfig)
    window.addEventListener('message', this.handleReceiveGetQiniuBucketList)

    messageCenter.requestGenerateQiniuUploadToken()
    messageCenter.requestGetQiniuPublicConfig()
    messageCenter.requestGetQiniuBucketList()
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.handleReceiveGenerateQiniuUploadToken)
    window.removeEventListener('message', this.handleReceiveGetQiniuPublicConfig)
    window.removeEventListener('message', this.handleReceiveGetQiniuBucketList)
  }
}
