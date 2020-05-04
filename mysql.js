/*
 * @Description: 
 * @Version: 2.0
 * @Autor: Lianzhidong
 * @Date: 2020-05-02 20:12:06
 * @LastEditors: Lianzhidong
 * @LastEditTime: 2020-05-04 20:28:55
 */
/*
 * @Description: 
 * @Version: 2.0
 * @Autor: Lianzhidong
 * @Date: 2020-04-25 19:36:51
 * @LastEditors: Lianzhidong
 * @LastEditTime: 2020-04-25 21:07:13
 */
const mysql = require('mysql')

//创建连接对象
// const con = mysql.createConnection(MYSQL_CONF)

const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    port: '3306',
    database: 'weibo'
})

//开始链接
con.connect()

//执行sql的函数
function exec(sql){
    console.log('打印sql')
    console.log(sql)
    const res = con.query(sql)
    return res
}

module.exports = {
    exec
}