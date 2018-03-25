// WAITING ON VERSION WITH STREAMS: https://github.com/webcaetano/mysqldump/issues/30

module.exports = ( state, callback ) => {

  const mysqlDump = require('node-mysql-dump');

  mysqlDump({
      host: config.mysql_host,
      user: config.mysql_user,
      password: config.mysql_pass,
      database: config.mysql_db,
      port: config.mysql_port,
      dest: state.files.path_db_sql // destination file
  },function(err){
    console.log(`Created db.sql file`)
    callback()
  })

}