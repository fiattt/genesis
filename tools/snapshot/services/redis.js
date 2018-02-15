var redis = require("redis")

module.exports = (host, port) => {
  return redis.createClient( { host:host, port: port } )
}
