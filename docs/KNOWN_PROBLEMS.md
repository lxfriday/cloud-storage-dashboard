# 已知问题

## 七牛

### commonPrefixes

Q:

- 由于七牛的文件夹机制问题，其文件夹是虚拟文件夹，依据 `commonPrefixes` 来确定，猜测其内部是依据 `listPrefix` 返回的文件归类得出的 文件夹，所以当文件数量超多的时候，比如 1001+，则一次加载不完所有文件，所以此次返回的 `commonPrefixed` 为空。

S:

- 无解

### 关于 yarn 和 npm

在 `package.json` 中使用的 npm，而项目管理用的 yarn，因为`package.json` 中使用 yarn 执行会导致一个问题，暂时不知道什么原因。
