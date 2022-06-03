import React, { useState, useEffect } from 'react'
import { Menu, message, notification, Spin, Tooltip, Button, Modal, Input, Checkbox } from 'antd'
import {
  SettingOutlined,
  LogoutOutlined,
  HomeOutlined,
  LockFilled,
  FolderFilled,
  DeleteFilled,
} from '@ant-design/icons'
import { NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import classnames from 'classnames'

import Login from '../Components/Login'
import { initSettings, logout, setHasLoginTrue } from '../store/settings'
import { updateBucketListAction, resetBucketInfoAction } from '../store/storageManage'
import * as messageCenter from '../utils/messageCenter'
import { defaultCORSRule } from '../utils/cloudserviceprovider/index'
import { debounce } from '../utils'
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
  // 预览将要提交的 CORS 信息
  const [previewCORSRulesBeforeSubmitModalVisible, setPreviewCORSRulesBeforeSubmitModalVisible] =
    useState(false)
  const [CORSRules, setCORSRules] = useState([])
  // 编辑用的 CORS
  const [editCORSRules, setEditCORSRules] = useState([])
  // 提交前预览用的，也是最终提交的数据
  const [editCORSRulesBeforeSubmit, setEditCORSRulesBeforeSubmit] = useState([])
  const [backImg, setBackImg] = useState()
  // 后台是否正在同步数据
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLoadingBucketList, setIsLoadingBucketList] = useState(false)
  // 是否正在提交 CORS 规则
  const [isSubmittingCORSRules, setIsSubmittingCORSRules] = useState(false)
  // 当前 CORS 流程中正在处理的 bucket 信息
  const [currentCORSProcessingBucketInfo, setCurrentCORSProcessingBucketInfo] = useState({
    bucket: '',
    region: '',
  })
  const dispatch = useDispatch()

  function handleChangeCSP() {
    dispatch(resetBucketInfoAction())
    dispatch(logout())
  }

  // 点击查看 CORS 信息
  function handleCheckBucketCORS(bucket, region) {
    setCurrentCORSProcessingBucketInfo({
      bucket,
      region,
    })
    messageCenter
      .requestGetBucketCORS(bucket, region)
      .then(res => {
        if (res.success) {
          setCORSRules(res.data)
          const editRules = res.data.map(_ => ({
            allowedMethods: _.allowedMethods,
            allowedHeaders: _.allowedHeaders.join(','),
            exposeHeaders: _.exposeHeaders.join(','),
            allowedOrigins: _.allowedOrigins.join(','),
            maxAgeSeconds: _.maxAgeSeconds,
          }))
          setEditCORSRules(editRules)
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

  if (hasLogin) {
    function handleCORSChange(targetIndex, k, val) {
      const newEditCORSRules = editCORSRules.map((_, i) => {
        if (i === targetIndex) {
          return {
            ..._,
            [k]: val,
          }
        } else {
          return _
        }
      })
      setEditCORSRules(newEditCORSRules)
    }

    function handleDeleteCORSRule(targetIndex) {
      const newEditCORSRules = []
      editCORSRules.forEach((_, i) => {
        if (i !== targetIndex) {
          newEditCORSRules.push(_)
        }
      })
      setEditCORSRules(newEditCORSRules)
    }

    function handleAddCORSRule() {
      setEditCORSRules([
        ...editCORSRules,
        {
          isNew: true, // 是新添加的
          ...defaultCORSRule[currentCSP.csp],
        },
      ])
    }

    // 预览 CORS Rules
    function handlePreviewCORSRules() {
      if (!editCORSRules.length) {
        message.error('没有要提交的 CORS 规则')
        return
      }
      try {
        // 对编辑的 CORS 规则进行处理，把字符串转换成数组
        const rules = []
        for (let _ of editCORSRules) {
          checkCRLF(_.allowedHeaders, 'Access-Control-Allow-Headers')
          checkCRLF(_.exposeHeaders, 'Access-Control-Expose-Headers')
          checkCRLF(_.allowedOrigins, 'Access-Control-Allow-Origin')
          if (!_.allowedMethods.length) {
            message.error('Access-Control-Allow-Methods 至少选择一个')
            return
          }
          if (!(parseInt(_.maxAgeSeconds) >= 0)) {
            message.error('Access-Control-Max-Age 必须是 大于等于0 的数字')
            return
          }
          rules.push({
            allowedMethods: _.allowedMethods,
            allowedHeaders: _.allowedHeaders
              .split(',')
              // 去除前导后置空格
              .map(_ => _.trim())
              // 去除空字符串
              .filter(v => v.length > 0),
            exposeHeaders: _.exposeHeaders
              .split(',')
              .map(_ => _.trim())
              .filter(v => v.length > 0),
            allowedOrigins: _.allowedOrigins
              .split(',')
              .map(_ => _.trim())
              .filter(v => v.length > 0),
            maxAgeSeconds: String(parseInt(_.maxAgeSeconds)),
          })
        }
        console.log('handlePreviewCORSRules', rules)
        setEditCORSRulesBeforeSubmit(rules)
        setPreviewCORSRulesBeforeSubmitModalVisible(true)
      } catch (e) {
        message.error('CORS 规则处理失败：' + e)
      }
    }

    // 提交 CORS 规则
    function handleSubmitCORSRules() {
      setIsSubmittingCORSRules(true)
      messageCenter
        .requestPutBucketCORS({
          ...currentCORSProcessingBucketInfo,
          rules: editCORSRulesBeforeSubmit,
        })
        .then(res => {
          if (res.success) {
            message.success('CORS 规则更新成功')
            setEditCORSRules([])
            setEditCORSRulesBeforeSubmit([])
            setPreviewCORSRulesBeforeSubmitModalVisible(false)
            setUpdateCORSRulesModalVisible(false)
          } else {
            message.error('CORS 规则更新失败：' + res.msg)
          }
        })
        .catch(e => {
          message.error('CORS 规则更新失败：' + e)
        })
        .finally(() => {
          setIsSubmittingCORSRules(false)
        })
    }

    return (
      <div className={styles.wrapper}>
        {/* 查看 CORS 规则 */}
        <Modal
          visible={checkCORSRulesModalVisible}
          title={`CORS 信息(${currentCORSProcessingBucketInfo.bucket})`}
          width={500}
          okText="更新 CORS"
          cancelText="取消"
          onOk={() => {
            setCheckCORSRulesModalVisible(false)
            setUpdateCORSRulesModalVisible(true)
            setCORSRules([])
          }}
          onCancel={() => {
            setCheckCORSRulesModalVisible(false)
            setCORSRules([])
            setEditCORSRules([])
          }}
          maskClosable={false}
          keyboard={false}
        >
          <div className={styles.checkCORSWrapper}>
            {CORSRules.map((_, i) => (
              <div key={i} className={styles.CORSItemWrapper}>
                <div className={styles.title}>Access-Control-Allow-Methods</div>
                <span className={styles.info}>{_.allowedMethods.join(', ')}</span>
                <div className={styles.title}>Access-Control-Allow-Headers</div>
                <span className={styles.info}>{_.allowedHeaders.join(', ')}</span>
                <div className={styles.title}>Access-Control-Expose-Headers</div>
                <span className={styles.info}>{_.exposeHeaders.join(', ')}</span>
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
                <div className={styles.title}>Access-Control-Max-Age</div>
                <span className={styles.info}>{_.maxAgeSeconds} 秒</span>
              </div>
            ))}
            {CORSRules.length === 0 && '没有配置 CORS 规则，将不能在本软件内上传文件'}
          </div>
        </Modal>
        {/* 编辑 CORS 规则 */}
        <Modal
          visible={updateCORSRulesModalVisible}
          title={`编辑 CORS 信息(${currentCORSProcessingBucketInfo.bucket})`}
          width={550}
          okText="预览"
          cancelText="取消"
          onOk={handlePreviewCORSRules}
          onCancel={() => {
            setUpdateCORSRulesModalVisible(false)
            setCORSRules([])
            setEditCORSRules([])
          }}
          maskClosable={false}
          keyboard={false}
        >
          <div className={styles.CORSForm}>
            {editCORSRules.length === 0 && (
              <div style={{ textAlign: 'center', marginBottom: 12 }}>还没有配置 CORS 规则</div>
            )}
            {editCORSRules.map((_, i) => (
              <div key={i} className={classnames(styles.formItemsWrapper, _.isNew && styles.isNew)}>
                <DeleteFilled
                  className={styles.delete}
                  title="删除"
                  onClick={() => handleDeleteCORSRule(i)}
                />
                {_.isNew && <span className={styles.isNew}>New</span>}
                <span className={styles.title}>Access-Control-Allow-Methods</span>
                <div className={styles.formItemWrapper}>
                  <Checkbox.Group
                    options={[
                      { label: 'PUT', value: 'PUT' },
                      { label: 'GET', value: 'GET' },
                      { label: 'POST', value: 'POST' },
                      { label: 'DELETE', value: 'DELETE' },
                      { label: 'HEAD', value: 'HEAD' },
                    ]}
                    value={_.allowedMethods}
                    onChange={e => {
                      handleCORSChange(i, 'allowedMethods', e)
                    }}
                  />
                </div>
                <span className={styles.title}>
                  Access-Control-Allow-Headers
                  <span className={styles.noti}>(用英文 , 分隔)</span>
                </span>
                <div className={styles.formItemWrapper}>
                  <Input.TextArea
                    value={_.allowedHeaders}
                    onChange={e => {
                      handleCORSChange(i, 'allowedHeaders', e.target.value)
                    }}
                  />
                </div>
                <span className={styles.title}>
                  Access-Control-Expose-Headers <span className={styles.noti}>(用英文 , 分隔)</span>
                </span>
                <div className={styles.formItemWrapper}>
                  <Input.TextArea
                    value={_.exposeHeaders}
                    onChange={e => {
                      handleCORSChange(i, 'exposeHeaders', e.target.value)
                    }}
                  />
                </div>
                <span className={styles.title}>
                  Access-Control-Allow-Origin
                  <span className={styles.noti}>
                    (用英文 , 分隔)(如果不包含 * 将不能在本软件内上传文件)
                  </span>
                </span>
                <div className={styles.formItemWrapper}>
                  <Input.TextArea
                    value={_.allowedOrigins}
                    onChange={e => {
                      handleCORSChange(i, 'allowedOrigins', e.target.value)
                    }}
                  />
                </div>
                <span className={styles.title}>Access-Control-Max-Age</span>
                <div className={styles.formItemWrapper}>
                  <Input
                    placeholder="CORS 过期时间，单位：秒"
                    value={_.maxAgeSeconds}
                    onChange={e => {
                      handleCORSChange(i, 'maxAgeSeconds', e.target.value)
                    }}
                  />
                </div>
              </div>
            ))}
            <div style={{ textAlign: 'center' }}>
              <Button type="primary" onClick={handleAddCORSRule}>
                新增一条规则
              </Button>
            </div>
          </div>
        </Modal>
        {/* 复查将要提交的 CORS 规则 */}
        <Modal
          visible={previewCORSRulesBeforeSubmitModalVisible}
          title={`提交 CORS 信息预览(${currentCORSProcessingBucketInfo.bucket})`}
          width={500}
          okText="提交"
          okButtonProps={{
            danger: true,
            type: 'primary',
            disabled: isSubmittingCORSRules,
            loading: isSubmittingCORSRules,
          }}
          cancelText="取消"
          onOk={() => {
            handleSubmitCORSRules()
          }}
          onCancel={() => {
            setPreviewCORSRulesBeforeSubmitModalVisible(false)
            setEditCORSRulesBeforeSubmit([])
          }}
          maskClosable={false}
          keyboard={false}
        >
          <div className={styles.checkCORSWrapper}>
            {editCORSRulesBeforeSubmit.map((_, i) => (
              <div key={i} className={styles.CORSItemWrapper}>
                <div className={styles.title}>Access-Control-Allow-Methods</div>
                <span className={styles.info}>{_.allowedMethods.join(', ')}</span>
                <div className={styles.title}>Access-Control-Allow-Headers</div>
                <span className={styles.info}>{_.allowedHeaders.join(', ')}</span>
                <div className={styles.title}>Access-Control-Expose-Headers</div>
                <span className={styles.info}>{_.exposeHeaders.join(', ')}</span>
                <div className={styles.title}>Access-Control-Allow-Origin</div>
                <div className={styles.info}>
                  {_.allowedOrigins.map((__, ii) => [
                    <span key={ii} className={styles.detailList}>
                      {__}
                    </span>,
                    <br key={ii + 'br'} />,
                  ])}
                </div>
                <div className={styles.title}>Access-Control-Max-Age</div>
                <span className={styles.info}>{_.maxAgeSeconds} 秒</span>
              </div>
            ))}
          </div>
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
                            onClick={e => {
                              e.stopPropagation()
                              handleCheckBucketCORS(_.name, _.region)
                            }}
                          >
                            查看 CORS
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

const debouncedNotificationWarn = debounce(notification.warn, 2000, true)

// 检查换行
function checkCRLF(str, tag) {
  if (str.includes('\n') || str.includes('\r') || str.includes('\r\n')) {
    debouncedNotificationWarn({
      message: '提示',
      description: (
        <div>
          <div>检测到 【{tag}】 包含【换行符】，请慎重确认换行符是你需要的。</div>
          <div style={{ fontWeight: 'bold' }}>本软件会默认使用【英文 ,】 进行字段拆分</div>
        </div>
      ),
      duration: 10,
    })
  }
}
