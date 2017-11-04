var redis = require("redis")
module.exports = redis.createClient( { host:REDIS_HOST, port: REDIS_PORT } )
