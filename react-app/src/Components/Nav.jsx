import React, { useState, useEffect } from 'react'
import {
  Menu,
  message,
  notification,
  Spin,
  Tooltip,
  Button,
  Modal,
  Form,
  Input,
  Checkbox,
} from 'antd'
import {
  SettingOutlined,
  LogoutOutlined,
  HomeOutlined,
  LockFilled,
  FolderFilled,
} from '@ant-design/icons'
import { NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import Login from '../Components/Login'
import { initSettings, logout, setHasLoginTrue } from '../store/settings'
import { updateBucketListAction, resetBucketInfoAction } from '../store/storageManage'
import * as messageCenter from '../utils/messageCenter'
import messageCommands from '../../../src/messageCommands'
import styles from './Nav.module.less'

const { SubMenu } = Menu

export default function Nav({ children }) {
  const backImgs = useSelector(state => state.settings.customBackImgs)
  const currentCSP = useSelector(state => state.settings.currentCSP)
  const hasLogin = useSelector(state => state.settings.hasLogin)
  const bucketList = useSelector(state => state.storageManage.bucketList)
  // 是否已经初始化了，用于在获取到登录信息之前做过渡
  const [hasInitialized, setHasInitialized] = useState(false)
  // 查看用
  const [checkCORSRulesModalVisible, setCheckCORSRulesModalVisible] = useState(false)
  // 更新用
  const [updateCORSRulesModalVisible, setUpdateCORSRulesModalVisible] = useState(false)
  const [CORSRules, setCORSRules] = useState([])
  const [backImg, setBackImg] = useState()
  // 后台是否正在同步数据
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLoadingBucketList, setIsLoadingBucketList] = useState(false)
  const dispatch = useDispatch()

  function handleChangeCSP() {
    dispatch(resetBucketInfoAction())
    dispatch(logout())
  }

  // 点击查看 CORS 信息
  function handleCheckBucketCORS(bucket, region) {
    messageCenter
      .requestGetBucketCORS(bucket, region)
      .then(res => {
        if (res.success) {
          setCORSRules(res.data)
          setCheckCORSRulesModalVisible(true)
        } else {
          message.error('CORS 信息获取失败：' + res.msg)
        }
      })
      .catch(e => {
        message.error('CORS 信息获取失败')
      })
  }

  useEffect(() => {
    let timer = null
    messageCenter
      .requestGetSettings()
      .then(res => {
        if (res.success) {
          const { data: settings } = res
          // 加定时器只是为了让 loading 稳定显示1秒，免得页面 render 太快，loading 就闪了一下，体验不好
          timer = setTimeout(() => {
            if (settings.customBackImgs.length) {
              setBackImg(
                settings.customBackImgs[Math.floor(Math.random() * settings.customBackImgs.length)]
              )
            }
            dispatch(initSettings(settings))
            if (!!settings.currentCSP && Object.keys(settings.currentCSP).length > 0) {
              // 如果 currentCSP 有值，则尝试用 currentCSP 去登录，检测 key 是否正确
              messageCenter
                .requestLogin(settings.currentCSP)
                .then(res2 => {
                  if (res2.success) {
                    dispatch(setHasLoginTrue())
                    dispatch(initSettings(res2.data))
                    message.success('登录成功')
                  } else {
                    notification.error({
                      message: '提示',
                      description: '登录失败：' + res2.msg,
                    })
                  }
                })
                .finally(() => {
                  setHasInitialized(true)
                })
            } else {
              // 如果没有 currentCSP 则不会去请求登录校验，仅仅是初始化好了，会显示登录界面
              setHasInitialized(true)
            }
          }, 1000)
        } else {
          message.error('获取初始配置信息失败：' + res.msg)
        }
      })
      .catch(e => {
        message.error('获取初始配置信息失败', String(e))
      })

    function startSyncing(ev) {
      const msg = ev.data
      if (msg.command === messageCommands.syncBucket_startSyncing) {
        setIsSyncing(true)
      }
    }
    function endSyncing(ev) {
      const msg = ev.data
      if (msg.command === messageCommands.syncBucket_endSyncing) {
        setIsSyncing(false)
      }
    }

    window.addEventListener('message', startSyncing)
    window.addEventListener('message', endSyncing)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('message', startSyncing)
      window.removeEventListener('message', endSyncing)
    }
  }, [])

  useEffect(() => {
    if (hasLogin) {
      // 获取 bucket 列表
      setIsLoadingBucketList(true)
      messageCenter
        .requestGetBucketList()
        .then(res => {
          if (res.success) {
            dispatch(updateBucketListAction(res.data))
          } else {
            message.error('bucket 列表获取失败：' + res.msg)
          }
        })
        .catch(() => {
          message.error('bucket 列表获取失败')
        })
        .finally(() => {
          setIsLoadingBucketList(false)
        })
    }
  }, [hasLogin])

  useEffect(() => {
    let interval = null
    if (backImgs.length) {
      setBackImg(backImgs[Math.floor(Math.random() * backImgs.length)])
      interval = setInterval(() => {
        setBackImg(backImgs[Math.floor(Math.random() * backImgs.length)])
      }, 1000 * 300)
    }
    return () => {
      clearInterval(interval)
    }
  }, [backImgs])

  if (!hasInitialized) {
    return (
      <div className={styles.loadingWrapper}>
        <Spin size="large" />
      </div>
    )
  }

  const layout = {
    labelCol: { span: 0 },
    wrapperCol: { span: 24 },
  }

  if (hasLogin) {
    return (
      <div className={styles.wrapper}>
        <Modal
          visible={checkCORSRulesModalVisible}
          title="CORS 信息"
          width={500}
          okText="确认"
          cancelText="取消"
          onOk={() => {
            setCheckCORSRulesModalVisible(false)
            setCORSRules([])
          }}
          onCancel={() => {
            setCheckCORSRulesModalVisible(false)
            setCORSRules([])
          }}
        >
          <div className={styles.checkCORSWrapper}>
            {CORSRules.map((_, i) => (
              <div key={i} className={styles.CORSItemWrapper}>
                <div className={styles.title}>Access-Control-Allow-Methods</div>
                <span className={styles.info}>{_.allowedMethods.join(', ')}</span>
                <div className={styles.title}>Access-Control-Allow-Headers</div>
                <span className={styles.info}>{_.allowedHeaders.join(', ')}</span>
                <div className={styles.title}>
                  Access-Control-Allow-Origin
                  <span className={styles.noti}>(如果不包含 * 将不能在本软件内上传文件)</span>
                </div>
                <div className={styles.info}>
                  {_.allowedOrigins.map((__, ii) => [
                    <span key={ii} className={styles.detailList}>
                      {__}
                    </span>,
                    <br key={ii + 'br'} />,
                  ])}
                </div>
                <div className={styles.title}>Access-Control-Expose-Headers</div>
                <span className={styles.info}>{_.exposeHeaders.join(', ')}</span>
                <div className={styles.title}>Access-Control-Max-Age</div>
                <span className={styles.info}>{_.maxAgeSeconds} 秒</span>
              </div>
            ))}
            {CORSRules.length === 0 && '没有配置 CORS 规则，将不能在本软件内上传文件'}
          </div>
        </Modal>
        <Modal
          visible={updateCORSRulesModalVisible}
          title="CORS 信息"
          width={500}
          okText="确认"
          cancelText="取消"
          onOk={() => {}}
          onCancel={() => {
            setUpdateCORSRulesModalVisible(false)
          }}
        >
          <Form {...layout} className={styles.CORSForm}>
            <span className={styles.title}>Access-Control-Allow-Methods</span>
            <Form.Item name={['user', 'name']} className={styles.formItemWrapper}>
              <Checkbox.Group
                options={[
                  { label: 'PUT', value: 'PUT' },
                  { label: 'GET', value: 'GET' },
                  { label: 'POST', value: 'POST' },
                  { label: 'DELETE', value: 'DELETE' },
                  { label: 'HEAD', value: 'HEAD' },
                ]}
                defaultValue={[]}
                onChange={() => {}}
              />
            </Form.Item>
            <span className={styles.title}>Access-Control-Allow-Headers</span>
            <Form.Item name={['user', 'name']} className={styles.formItemWrapper}>
              <Input.TextArea />
            </Form.Item>
            <span className={styles.title}>Access-Control-Expose-Headers</span>
            <Form.Item name={['user', 'name']} className={styles.formItemWrapper}>
              <Input.TextArea />
            </Form.Item>
            <span className={styles.title}>Access-Control-Allow-Origin</span>
            <Form.Item name={['user', 'name']} className={styles.formItemWrapper}>
              <Input.TextArea />
            </Form.Item>
            <span className={styles.title}>Access-Control-Max-Age</span>
            <Form.Item name={['user', 'name']} className={styles.formItemWrapper}>
              <Input placeholder="CORS 过期时间，单位：秒" />
            </Form.Item>
          </Form>
        </Modal>
        <div className={styles.sideWrapper}>
          <div className={styles.sideTopWrapper}>
            <div className={styles.siteTitle}>云存储管理</div>
            <Menu
              style={{ width: 180 }}
              defaultSelectedKeys={['home']}
              defaultOpenKeys={['sub1']}
              mode="inline"
              theme="light"
            >
              <Menu.Item key="home" icon={<HomeOutlined />}>
                <NavLink
                  to="/"
                  className={({ isActive }) => (isActive ? styles.navLinkActive : undefined)}
                >
                  首页
                </NavLink>
              </Menu.Item>
              {isLoadingBucketList && (
                <Menu.Item key="loading-bucketlist">
                  <div style={{ textAlign: 'left' }}>
                    <Spin /> loading
                  </div>
                </Menu.Item>
              )}

              {bucketList.map(_ => (
                <Menu.Item key={_.name} icon={_.isPrivateRead ? <LockFilled /> : <FolderFilled />}>
                  <Tooltip
                    placement="right"
                    title={
                      <div>
                        <div>bucket: {_.name}</div>
                        {!!_.region && <div>区域: {_.region}</div>}
                        {!!_.acl && <div>读写规则: {_.acl}</div>}
                        <div style={{ margin: '10px 0 18px' }}>
                          <Button
                            size="small"
                            type="primary"
                            onClick={handleCheckBucketCORS.bind(null, _.name, _.region)}
                          >
                            查看 CORS
                          </Button>
                          <Button
                            size="small"
                            type="primary"
                            danger
                            onClick={handleCheckBucketCORS.bind(null, _.name, _.region)}
                            style={{ marginLeft: 12 }}
                          >
                            更新 CORS
                          </Button>
                        </div>
                      </div>
                    }
                  >
                    <NavLink
                      to={`/storagemanage?space=${_.name}`}
                      className={({ isActive }) => (isActive ? styles.navLinkActive : undefined)}
                      style={{ fontSize: 12 }}
                    >
                      <div>{_.name}</div>
                    </NavLink>
                  </Tooltip>
                </Menu.Item>
              ))}
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
          <div className={styles.sideBottomWrapper}>
            {isSyncing && (
              <div className={styles.isSyncing}>
                <Spin size="small" style={{ marginRight: 10 }} /> bucket 数据同步中
              </div>
            )}
            <Menu style={{ width: 180 }} mode="inline" theme="light" selectedKeys={[]}>
              <Menu.Item key="changeCSP" icon={<LogoutOutlined />} onClick={handleChangeCSP}>
                {currentCSP.nickname}(切换)
              </Menu.Item>
            </Menu>
          </div>
        </div>
        <div className={styles.contentWrapper}>
          <div className={styles.backImg} style={{ backgroundImage: `url('${backImg}')` }}></div>
          <div className={styles.backImgOverlay}></div>
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    )
  } else {
    return <Login />
  }
}
