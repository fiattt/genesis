const Sequelize = require('sequelize')
module.exports = new Sequelize(
  SS_CONFIG_MYSQL_DB,
  SS_CONFIG_MYSQL_USER,
  SS_CONFIG_MYSQL_PASS,
  {
    host: SS_CONFIG_MYSQL_HOST,
    port: SS_CONFIG_MYSQL_PORT,
    dialect: "mysql",
    logging:false
  }
)
