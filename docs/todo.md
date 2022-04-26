# TODO

## high priority

- 首页介绍-导流到 github star，bilibili，

  - 包含操作指引

- 如果碰到 home 没办法确定的情况，需要用户指定 home dir

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

## low priority

- 上传管理，上传中的文件数统计不正常
- ? 上传 and 显示的时候自动补齐文件后缀

## BUG

- 多窗口问题
  - 打开多个 云存储管理 窗口的时候，可能会存在两个或多个不同的平台，而由于 server 端是保存有 csp 状态的，所以会导致混乱出错
  - solve：server 不再保存状态，前端每次传 keys 到 server 端
