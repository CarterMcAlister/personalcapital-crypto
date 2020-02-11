async function filter(arr, callback) {
  const fail = Symbol()
  return (
    await Promise.all(
      arr.map(async item => ((await callback(item)) ? item : fail))
    )
  ).filter(i => i !== fail)
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

const timeout = ms => new Promise(resolve => setTimeout(resolve, ms))

const formatTicker = ticker => '$' + ticker.toUpperCase()

module.exports = { filter, asyncForEach, timeout, formatTicker }
