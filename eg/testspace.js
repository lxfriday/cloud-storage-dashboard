const http = require('http')

const data = new Array(20000000).fill(1).map(v => ({
  id: `Date.now()` + Date.now(),
  mime: `application/json`,
  key: '/fsdfsdf/fsdgdfgrde/ghdfthtfrh/tyjtuyjfgh/dfgfhjugyfj/ghfdvdfgdgh/rtfghfghgfjhghj.png',
  putTime: Date.now(),
  hash: 'dfsnkjufhksdlhfkjsdhbnfkjdshfikludjshgbfkjcnsdfklughdesjkufgsbejufg',
}))

const app = http.createServer((req, res) => {
  res.writeHead(200)
  res.end(JSON.stringify(data[0]))
})

app.listen(3721)
console.log('listening')

// 实测结果 500w 占用 600M
// 1000w 条数据 占用 1G
// 2000w 条数据 占用 2.5G
