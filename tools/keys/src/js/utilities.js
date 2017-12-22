// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const ecc         = require('eosjs-ecc'),
      seedrandom  = require('seedrandom'),
      crypto      = require('crypto'),
      algorithm   = 'aes-256-ctr',
      sha256      = require('sha256')

let   SEED_SHOW,
      errors,
      tries

const util = {}

util.genKeyPair = (seed) => {
  var d
  if(typeof seed !== 'undefined')
    d = ecc.PrivateKey.fromSeed(seed)
  else
    d = ecc.PrivateKey.randomKey()

  var privkey = d.toWif()
  var pubkey = d.toPublic().toString()

  // console.log(privkey, pubkey)

  var pubkeyError = null
  try {
    ecc.PublicKey.fromStringOrThrow(pubkey)
  } catch(error) {
    console.log('pubkeyError', error, pubkey)
    pubkeyError = error.message + ' => ' + pubkey
  }

  var privkeyError = null
  try {
    var pub2 = ecc.PrivateKey.fromWif(privkey).toPublic().toString()
    if(pubkey !== pub2)
      throw {message: 'public key miss-match: ' + pubkey + ' !== ' + pub2}
  } catch(error) {
    console.log('privkeyError', error, privkey)
    privkeyError = error.message + ' => ' + privkey
  }

  if(privkeyError || pubkeyError)
    tries++,
    genKeyPair(seed)

  if(tries > 3)
    return "Does not compute."

  return { public: pubkey, private: privkey }
}

util.keygenFailure = (Pk, pk, pubkeyError, privkeyError) => {
  //show error
  //show this information tell them to share {Pk, pk, pubkeyError, privkeyError}
}

util.outputKeyPair = show => {
  //display the seed
}

util.saveKeyPairToFile = keypair => {
  //save seed to encrypted file.
}

util.encrypt = (keypair, password) => {
  const cipher = crypto.createCipher(algorithm, password)
  let crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex')
  return crypted
}

util.decrypt = (encrypted, password) => {
  var decipher = crypto.createDecipher(algorithm, password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8')
  return dec;
}

util.validateKeypair = (pub, priv) => {
  // console.log(pub, priv)
  const valid = { publicKey: false, privateKey: false }
  if(util.isPublicKey(pub)) valid.publicKey = true
  if(pub === util.publicKeyFromPrivateKey(priv)) valid.privateKey = true
  // console.log(pub === util.publicKeyFromPrivateKey(priv))
  return valid;
}

util.isPublicKey = publicKey => {
  return ecc.PublicKey.fromString(publicKey) != null
}

util.publicKeyFromPrivateKey = privateKey => {
  return ecc.PrivateKey.fromWif(privateKey).toPublic().toString()
}

util.generateSeed = (update, finished) => {
  const every = util.randomBetween(200, 300)
  const loops = util.randomBetween(8, 12)

  let t = []
  let count = 0
  let total = 0
  let seed = ""

  const gen = e => {      // Define a custom entropy collector.
    let random
    count++
    update( Math.floor(total/every*loops) )
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
        fin(),
        finished(seed)
  }
  const fin = () => {
    document.removeEventListener('mousemove', gen)
    document.removeEventListener('keyup', gen)
  }
  document.addEventListener('mousemove',gen)
  document.addEventListener('keyup', gen)
}

util.randomBetween = (min,max) => {
  Math.seedrandom();
  return Math.floor(Math.random()*(max-min+1)+min)
}

util.reset = () => {
  SEED_SHOW = false
}

module.exports = util
