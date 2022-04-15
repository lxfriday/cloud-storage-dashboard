# DEV README

## before start

在开始开发之前，先添加必备文件到 `src/utils/cspAdaptor`。

文件内容：

```typescript
export default {
  ak: '',
  sk: '',
}
```

- 七牛：`qiniu.keys.ts`

## 目录结构

- `node` 层支持在 `src` 文件夹下
- 页面 ui 层在 `react-app` 文件夹中
- `node` 和 `react-app` 的 `node_modules` 不共享
- `node` 和 `react-app` 共同依赖 `src/messageCommands.ts`，用来存储两端交互的通信指令


## 扩展编译
