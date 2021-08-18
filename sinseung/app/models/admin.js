const mysql = require('mysql');
const DB = require('../../config/database');
const conn = mysql.createConnection(DB.admin);
const errs = require('../../config/errors');

module.exports = {
  "selectConfig" : (cb) =>{//관리자에 의해 관리되는 데이터를 조회합니다.
    conn.query('select * from ss_config', (err, rows, fields) =>{
      if(err){
        console.log(err);
        cb(errs.internalServerError, null);
      }
      cb(err, rows);
    });
  },
  "selectCompany" : (cb) =>{
    conn.query('select * from ss_company', (err, rows, fields) =>{
      if(err){
        console.log(err);
        cb(errs.internalServerError, null);
      }
      cb(err, rows)
    })
  },
  "editCompany" : (query, cb) =>{
    conn.query(query, (err, data) =>{
      if(err){
        console.log(err);
        if(err.errno && err.errno == 1451) cb(errs.cannotDeleteKey, [66]);
        else if(err.errno && err.errno == 1062) cb(errs.cannotUpdateKey, [99]);
      }
      else cb(err, [200]);
    });
  },
  'escape' : (value) =>{
    return conn.escape(value);
  }
}
