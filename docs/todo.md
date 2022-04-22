# TODO

## high priority

- 文件下载

  - 并发控制 async
  - 专业文件下载器 https://www.npmjs.com/package/nodejs-file-downloader

- 文件搜索
- 文件夹问题

  - 在 server 端直接加载 1w 条数据，把 1w 条的 commonprefix 作为文件夹，这样放大了样本数量

- 按照 大小、创建时间筛选
- 更改列表显示模式
  - 由 grid 变更为 list（二维变一维）

## new feat

## Other

## 文件夹

- ？ 文件夹内文件数量，文件占用的空间
- 下载文件夹（下载文件夹中的所有文件）
- 删除文件夹

## 上传

## 下载

- 下载单文件
- 下载多文件
- 文件下载
- 让用户选择文件夹，这样把所有文件都放到下载文件夹中
- 某些特殊文件，可以下载完之后直接打开（用系统默认的方式）

## low priority

- 上传管理，上传中的文件数统计不正常
- ? 上传 and 显示的时候自动补齐文件后缀

## BUG

- 多窗口问题
  - 打开多个 云存储管理 窗口的时候，可能会存在两个或多个不同的平台，而由于 server 端是保存有 csp 状态的，所以会导致混乱出错
  - solve：server 不再保存状态，前端每次传 keys 到 server 端
