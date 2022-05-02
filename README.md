<div align="center">
  <h1>云存储管理</h1>
  <img src="https://gitee.com/lxfriday/vscode-cloud-storage-dashboard/raw/main/assets/logo_64x64.png" />
  <p>😻 😻 😻 在 VSCode 上也能管理你的云存储啦！！！</p>
</div>

![1](https://gitee.com/lxfriday/vscode-cloud-storage-dashboard/raw/main/assets/screenshots/1.png)
![5](https://gitee.com/lxfriday/vscode-cloud-storage-dashboard/raw/main/assets/screenshots/5.png)
![2](https://gitee.com/lxfriday/vscode-cloud-storage-dashboard/raw/main/assets/screenshots/2.png)
![3](https://gitee.com/lxfriday/vscode-cloud-storage-dashboard/raw/main/assets/screenshots/3.png)
![4](https://gitee.com/lxfriday/vscode-cloud-storage-dashboard/raw/main/assets/screenshots/4.png)

## 平台支持情况

- ✔️ 七牛云
- 腾讯云
- 阿里云
- 又拍云
- 青云
- 亚马逊 S3
- 🚘 其他（逐步纳入开发计划）

## 功能介绍

云存储管理扩展目前已经能覆盖到对云存储文件的全方位操作

- 上传
  - 单、多文件上传
  - 文件夹上传
  - 拖拽上传
  - 粘贴上传
  - 截图上传
  - 从 URL 直接上传文件
  - 上传完成时自动复制
- 下载
  - 自定义下载目录
  - 单、多文件下载
- 一键导出文件列表
- 上传、下载管理
  - 进度管理
  - 取消上传、下载
- 文件操作
  - 批量选择
    - 单击文件就可以选中某个文件
    - 右键文件，点击全选，则可以选中文件夹下的所有文件
  - 重命名
  - 移动
  - 删除
  - CDN 刷新
  - 同时对多文件删除、刷新 CDN
- 搜索
  - 文件搜索
  - 文件夹搜索
  - 不区分大小写搜索
- 文件夹
  - 支持文件夹模式显示
  - 对文件夹刷新 CDN
- 账号管理（key 管理）
  - 可以同时打开多个 tab
  - 登录过之后自动保存
- 设置
  - 显示时启、停用 HTTPS 链接
  - 上传是否包含原文件名
  - 删除时可以不需要确认直接删除
  - 复制到剪切板的格式可以是 url 或者 markdown 格式
  - 自己指定文件下载目录
  - 自定义扩展右下角的背景图

### 登录

- 输入 ak、sk 和 别名即可进入对应平台的云存储管理，别名可以理解为就是给这次登录取个名字，后面选择登录的时候方便标识
- 在最下面已登录中可以看到历史登录成功过的记录（都是在本地的，放心没有后门）

### 主功能界面 - 存储空间

对云存储的管理基本都在 存储空间下的对应 bucket 完成，选择某个 bucket 就可以对 bucket 里面的文件进行相应操作。

### 关于搜索

各云平台本不提供搜索能力，搜索的实现依赖于本地会对 bucket 内的文件信息做同步，同步完成之后，本地会最多存储一个 bucket 内 10w 条文件信息（是文件信息不是文件），这些文件信息有两个作用。一个是用来作为提供搜索服务，另一个作用是依据各文件的 key 分析出 bucket 内的虚拟文件夹信息，从而提供给前端页面显示文件夹。

- 搜索关键词不区分大小写
- 可以依据文件名中的关键字搜索文件
- 也可以依据文件夹名，直接搜索文件夹下面的所有文件（最多返回 1000 个）

### 关于文件夹

由于各云平台存储文件的时候采用的是 k-v 存储结构，实际上是不存在文件夹概念的，为了方便管理，也给出了解决方案，就是 key 中使用 `/` 来区分文件夹，注意这只是管理层面的区分。那么依据 `/` 就有可以拆分出一层一层的虚拟文件夹。

对于七牛而言，每次获取文件信息的时候最多只会返回 1000 条数据，而其返回的文件夹信息是依据这 1000 条数据分析得到的文件夹，所以是不完整的，因为才引入了 **本地 bucket 同步** 的概念。本地 bucket 同步会最多同步 bucket 内 10w 条文件信息，并且存储在本地，从这 10w 条数据中分析出 bucket 内的文件夹概念，再返回给前端，来显示出更完善的文件夹。

**本地 bucket 同步**只是扩大了分析样本的数量，如果 bucket 内的文件量大于 10w 条，依然会可能会存在文件夹不对的情况。

### 关于创建、变更或者删除文件之后搜索会出现不同步的情况

上面提到了搜索的原理，简而言之本地会存储 bucket 内的文件信息，如果创建变更删除文件，本地同步的 bucket 信息没那么快同步下来，默认策略是隔 1 个小时会同步一次 bucket。

**当然**如果你想要立即获得最新的搜索信息，你可以把鼠标放到搜索条左边的三个点，然后点击 **强制同步本地 bucket 信息**，来让扩展后台立即执行对 bucket 内文件的同步。

同步的时候，左下角会提示你是否正在进行同步，等同步进行完成之后再搜索就可以获得最新的 bucket 内文件信息了。

## 源码开发

这个项目的源码难度比较大，难点在于需要理解内部的一些处理逻辑。

- `npm run ins` 安装依赖
  - 同时安装 扩展 和 react-app 两个子项目的依赖
- `npm run dev` 启动 react-app 应用服务器
- `F5` 启动 扩展调试
- 点击右下角【云存储管理进入页面】

上述过程一定要先执行 `npm run dev` 再按 `F5`。因为 `npm run dev` 会生成一个公共端口供扩展端和 react-app 端一起使用。如果先按 `F5` 启动扩展，则扩展启动之后加载的端口会与 react-app 服务器对应的端口不一致。

### 技术栈

扩展端

- ts
- axios

react-app

- react
- react-router
- redux
- antd

### 关于扩展端和 react-app 协同工作

两端的交互依赖于 `postMessage`，也就是直接传递消息来实现数据传递，区别于传统前端通过网络请求获取数据。内部封装了 `messageAdaptor.jsx` 来实现双端便捷通信，使用起来非常简单。

## 构建&发布

- `npm run build` 进行 extension(ts) 和 前端(react-app) 的编译处理
- `npm run package` 编译并打包(vsce 自动打包)

## Roadmap

see [todo](https://github.com/lxfriday/cloud-storage-dashboard/blob/main/docs/todo.md)

## 联系

- [📺 云影同学 yunyuv](https://space.bilibili.com/15445514)
