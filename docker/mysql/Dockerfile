FROM mysql:latest

COPY startup /etc/mysql/startup
COPY my.cnf /etc/mysql/conf.d/my.cnf

RUN chown -R mysql:root /var/lib/mysql/

ARG MYSQL_DATABASE=eos_snapshot
ARG MYSQL_ROOT_PASSWORD=root
ARG MYSQL_ROOT_USER=root

ENV MYSQL_DATABASE=$MYSQL_DATABASE
ENV MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD
ENV MYSQL_ROOT_USER=$MYSQL_ROOT_USER

RUN sed -i 's/MYSQL_DATABASE/'$MYSQL_DATABASE'/g' /etc/mysql/startup
RUN sed -i 's/MYSQL_ROOT_USER/'$MYSQL_ROOT_USER'/g' /etc/mysql/startup
RUN sed -i 's/MYSQL_ROOT_PASSWORD/'$MYSQL_ROOT_PASSWORD'/g' /etc/mysql/startup

CMD ["mysqld", "--init-file=/etc/mysql/startup"]

EXPOSE 3306
