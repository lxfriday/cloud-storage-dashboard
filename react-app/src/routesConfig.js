import Home from './Pages/Home/index'
import Settings from './Pages/Settings/index'
import StorageManage from './Pages/StorageManage/index'

const routes = [
  {
    path: '/settings',
    comp: Settings,
    title: '设置',
  },
  {
    path: '/storagemanage',
    comp: StorageManage,
    title: '管理存储空间',
  },
  // 这里用 * 而不是 /，是因为 vscode 的特殊情况，默认不会匹配到任何路由
  {
    path: '*',
    comp: Home,
    title: '首页',
  },
]

export default routes
