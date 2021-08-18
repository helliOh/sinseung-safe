module.exports = {
  "session" : {
    host: 'localhost',
    port: 3306,
    user: 'pepperoni',
    password: process.env.DB_SECRET,
    database: 'member'
  },
  "member" : {
    host : 'localhost',
    user : 'pepperoni',
    password : process.env.DB_SECRET,
    database : 'member',
    dateStrings : true
  },
  "client" : {
    host : 'localhost',
    user : 'pepperoni',
    password : process.env.DB_SECRET,
    database : 'client',
    dateStrings : true,
    multipleStatements: true
  },
  "cms" : {
    host : 'localhost',
    user : 'pepperoni',
    password : process.env.DB_SECRET,
    database : 'cms',
    dateStrings : true,
    multipleStatements: true
  },
  "log" : {
    host : 'localhost',
    user : 'pepperoni',
    password : process.env.DB_SECRET,
    database : 'log',
    dateStrings : true
  },
  "etc"   : {
    host : 'localhost',
    user : 'pepperoni',
    password : process.env.DB_SECRET,
    database : 'etc',
    dateStrings : true,
    multipleStatements: true
  },
  "admin"   : {
    host : 'localhost',
    user : 'pepperoni',
    password : process.env.DB_SECRET,
    database : 'admin',
    dateStrings : true
  }
};
