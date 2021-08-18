const stream = require('stream');

const aws = require('../../config/aws');

const multer = require('multer');
const memory = multer.memoryStorage();

const mysql = require('mysql');
const exceljs = require('exceljs');

const DB = require('../../config/database');
const errs = require('../../config/errors');
const member = mysql.createConnection(DB.member);
const client = mysql.createConnection(DB.client);
const etc = mysql.createConnection(DB.etc);

module.exports = {
  'upload' : (params, cb) =>{
    aws.createConnection({
      'connType' : 'put',
      'dir' : params.dir,
      'key' : params.key,
      'mimetype' : params.mimetype,
      'buffer' : params.buffer
    }, (config, conn) =>{
      conn.upload(config, {}, (err, data) =>{
        if(err) cb(err, data);
        else cb(err, data);
      });
    });
  },
  'download' : (params, cb) =>{
    aws.createConnection({
      'connType' : 'get',
      'key' : params.key
    }, (config, conn) =>{
      conn.getObject(config, (err, data) =>{
        if(err){
          console.log(err);
          cb(errs.internalServerError, data);
        }
        else cb(err, data);
      });
    });
  },
  'util' : {
    'encode': (postfix) =>{
      let now = new Date();
      let dd = now.getDate() + '';
      if(dd.length < 2) dd = '0' + dd;
      let MM = now.getMonth() + 1 + ''; //January is 0!
      if(MM.length < 2) MM = '0' + MM;
      let yyyy = now.getFullYear() + '';
      let hh = now.getHours() + '';
      if(hh.length < 2) hh = '0' + hh;
      let mm = now.getMinutes() + '';
      if(mm.length < 2) mm = '0' + mm;
      let ss = now.getSeconds() + '';
      if(mm.length < 2) ss = '0' + ss;
      let prefix = yyyy+MM+dd+hh+mm+ss;

      return Buffer.from(prefix+":"+postfix).toString('base64').replace('/', '&');
    },
    'decode' : (src) =>{
      let org = Buffer.from(src.replace('&', '/'), 'base64').toString('utf-8');
      let date = org.split(':')[0];
      let filename = org.split(':')[1];
      return {
        'filedate' : date,
        'filename' : filename
      };
    }
  },
  'getFileList' : (cb) =>{
    etc.query('select * from filelist', (err, rows, fields) =>{
      if(err){
        console.log(err);
        cb(errs.internalServerError, rows);
      }
      else cb(err, rows);
    });
  },
  'getFileListS3' : (params, cb) =>{
    aws.createConnection({
      'connType' : 'list',
      'dir' : params.dir
    }, (config, conn) =>{
      conn.listObjects(config, (err, data) =>{
        if(err){
          console.log(err);
          cb(errs.internalServerError, data);
        }
        else cb(err, data);
      });
    });
  },
  'deleteFiles' : (params, cb) =>{
    aws.createConnection({
      'connType' : 'delete',
      'list' : params.list
    }, (config, conn) =>{
      conn.deleteObjects(config, (err, data) =>{
        if(err){
          console.log(err);
          cb(errs.internalServerError, data);
        }
        else cb(err, data);
      });
    });
  },
  'getSession' : () =>{
    return multerSession();
  }
}

var multerSession = () =>{
  return multer({ 'storage' : memory });
}
