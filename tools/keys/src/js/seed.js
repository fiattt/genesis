module.exports = (begin, progress, finished) => {

  const every = util.randomBetween(200, 300)
  const loops = util.randomBetween(8, 12)

  let t, count, total, seed

  const reset = () => {
    t = []
    count = 0
    total = 0
    seed = ""
  }

  const gen = e => {      // Define a custom entropy collector.
    let random
    count++
    progress( Math.floor(total/every*loops) )

    if(typeof e.pageX != 'undefined')
      t.push([e.pageX, e.pageY, +new Date])

    if(typeof e.key != 'undefined')
      t.push(e.key)

    if(count > every)
      random = new Math.seedrandom(t, {entropy: true}),
      seed = sha256(new String(random.int32())+seedrandom(seed)),
      t = [],
      total += count,
      count = 0

    if(total > every*loops)
      finished( seed )
  }

  reset()
  begin( gen )

  return true
}
