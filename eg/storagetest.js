const fs = require('fs')
const path = require('path')

// const data = new Array(100000).fill(1).map(_ => ({
//   key: 'dhsajkdfhbdskjfnksdmfnaksjdhaklsjdghbljkasghfljdhsugnumberhsdgfljdshgfdajklsbdnjkl;ashdfisuhfkdjslbfk;dsjhas;jkdfghkdls;ujgfkl;dsbfghjk.png',
//   size: 53215,
// }))

// fs.writeFileSync(path.join(__dirname, 'store2.json'), JSON.stringify(data))

// 50w => 76M
// 10w => 15M

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'store2.json')).toString())
console.log(data)

const target = []

data.forEach(d => {
  if (d.key.includes('ashdf')) target.push(d)
})

console.log(target)
