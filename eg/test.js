function test() {
  return new Promise((res, rej) => {
    rej(111)
  })
}

async function run() {
  const res = await test()
  console.log('res', res)
}

run()
