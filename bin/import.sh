#!/bin/bash
/usr/bin/mysqld_safe --skip-grant-tables &
sleep 5
mysql -u root -proot -e "CREATE DATABASE IF NOT EXISTS eos_snapshot"
mysql -u root -proot eos_snapshot < /opt/app/bin/schema.sql
