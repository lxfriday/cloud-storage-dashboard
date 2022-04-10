import React, { Component } from 'react'
import styles from './Nav.module.less'
import { Menu, Button, Upload, message, Select } from 'antd'
import { FolderOpenOutlined, SettingOutlined, UploadOutlined } from '@ant-design/icons'
import { NavLink } from 'react-router-dom'
import copy from 'copy-text-to-clipboard'
import { generateUploadImgInfo } from '../utils'
import * as messageCenter from '../utils/messageCenter'

const { SubMenu } = Menu
const { Option } = Select

export default class Nav extends Component {
  constructor() {
    super()
    this.state = {
      qiniuConfig: {
        token: '',
        imgDomain: '',
        bucket: '',
      },
      bucketList: [],
      bucketDomains: [],
      selectBucketDomain: '',
    }
  }

  handleChangeDomain = domain => {
    console.log('handleChangeDomain', domain)
    this.setState({ selectBucketDomain: domain })
  }

  render() {
    const { children } = this.props
    const { qiniuConfig, bucketList, bucketDomains, selectBucketDomain } = this.state
    const selectFileUploadProps = {
      multiple: true,
      action: 'http://upload.qiniu.com',
      showUploadList: false,
      beforeUpload: () => {
        messageCenter.requestGenerateQiniuUploadToken()
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
          console.log(info.file, info.fileList)
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

    // console.log('nav state', this.state)

    return (
      <div className={styles.wrapper}>
        <div className={styles.sideWrapper}>
          <div className={styles.siteTitle}>云存储管理</div>
          <Menu
            style={{ width: 180 }}
            defaultSelectedKeys={['home']}
            defaultOpenKeys={['sub1']}
            mode="inline"
            theme="dark"
          >
            <Menu.Item key="home" icon={<SettingOutlined />}>
              <NavLink
                to="/"
                className={({ isActive }) => (isActive ? styles.navLinkActive : undefined)}
              >
                首页
              </NavLink>
            </Menu.Item>
            <SubMenu key="sub1" icon={<FolderOpenOutlined />} title="存储空间">
              {bucketList.map(bk => (
                <Menu.Item key={bk}>
                  <NavLink
                    to={`/storagemanage?space=${bk}`}
                    className={({ isActive }) => (isActive ? styles.navLinkActive : undefined)}
                  >
                    {bk}
                  </NavLink>
                </Menu.Item>
              ))}
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
        <div className={styles.contentWrapper}>{children}</div>
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
  // 接收七牛 bucket list
  handleReceiveGetQiniuBucketList = event => {
    const message = event.data // The JSON data our extension sent
    if (message.command === 'getQiniuBucketList') {
      this.setState({
        bucketList: message.data,
      })
    }
  }
  // 接收七牛 bucket domains
  handleReceiveGetBucketDomains = event => {
    const message = event.data // The JSON data our extension sent
    if (message.command === 'getBucketDomains') {
      this.setState({
        bucketDomains: message.data,
        selectBucketDomain: message.data[message.data.length - 1],
      })
    }
  }

  componentDidMount() {
    window.addEventListener('message', this.handleReceiveGenerateQiniuUploadToken)
    window.addEventListener('message', this.handleReceiveGetQiniuPublicConfig)
    window.addEventListener('message', this.handleReceiveGetQiniuBucketList)
    window.addEventListener('message', this.handleReceiveGetBucketDomains)

    messageCenter.requestGenerateQiniuUploadToken()
    messageCenter.requestGetQiniuPublicConfig()
    messageCenter.requestGetQiniuBucketList()
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.handleReceiveGenerateQiniuUploadToken)
    window.removeEventListener('message', this.handleReceiveGetQiniuPublicConfig)
    window.removeEventListener('message', this.handleReceiveGetQiniuBucketList)
    window.removeEventListener('message', this.handleReceiveGetBucketDomains)
  }
}
