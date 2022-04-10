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
  {
    path: '*',
    comp: Home,
    title: '首页',
  },
]

export default routes
