const stream = require('stream');

const errs = require('../../config/errors');

const member = require('../models/member');
const client = require('../models/client');
const fileServer = require('../models/fileServer');
const cms = require('../models/cms');

const cron = require('node-cron');
const numeral = require('numeral');
const bcrypt = require('bcrypt-nodejs');
const dateFormat = require('dateformat');
const mime = require('mime-types');

exports.multer = fileServer.getSession();

exports.tasks = {
  'deleteUnlinked' : cron.schedule('58 2 * * *', ()=>{
    //fetch file list in the data-base
    fileServer.getFileList((err, rows) =>{
      if(err) return null;
      else{
        let listFromDB = [];

        for(i in rows){
          let r = rows[i];
          let d = r.attachment;
          d = JSON.parse(d);

          for(j in d) listFromDB.push(d[j]);
        }

        fileServer.getFileListS3({'dir' : 'db/'}, (err, data) =>{
          if(err) return console.log(err);
          else{
            let listFromS3 = [];
            for (i in data.Contents){
              if(data.Contents[i].Key.split('/')[1].length > 1) listFromS3.push(data.Contents[i].Key);
            }

            fileServer.getFileListS3({'dir' : 'board/'}, (err, data) =>{
              if(err) return console.log(err);
              else{
                for (i in data.Contents){
                  if(data.Contents[i].Key.split('/')[1].length > 1) listFromS3.push(data.Contents[i].Key);
                }

                let listExpired = listFromS3.filter((i) =>{ return listFromDB.indexOf(i) < 0;});
                for (i in listExpired) listExpired[i] = {'Key' : listExpired[i]};
                if(listExpired.length < 1) return console.log(`node-cron :: S3 objects delete done.(${listExpired.length}) no need to delete`);

                fileServer.deleteFiles({'list' : listExpired}, (err, data) =>{
                  if(err) return console.log(err);
                  else{

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
                    now = yyyy+MM+dd+hh+mm+ss;

                    console.log(`node-cron :: S3 objects delete done.(${listExpired.length}) time :${now}`);
                    return console.log(data);
                  }
                });
              }
            });
          }
        });
        //get list from aws s3
        //compare two list
        //delete from s3
      }
    });
  },
  {'scheduled' : false})
}

exports.get = {
  'download' : (req, res) =>{
    let key = req.params.dir + '/' + req.params.key;
    let params = {
      'key' : key
    };

    fileServer.download(params, (err, data) =>{
      if(!data) res.json(errs.invalidKey);
      else{
        let header = fileServer.util.decode(key.split('/')[1]);
        var readStream = new stream.PassThrough();
        readStream.end(data.Body);
        // console.log(fileServer.util.decode(req.params.key));
        // console.log(encodeURI(fileServer.util.decode(req.params.key).filename));
        res.charset = 'utf-8';
        res.set('Content-disposition', 'attachment; filename=' + encodeURI(fileServer.util.decode(req.params.key).filename));
        res.set('Content-Type', data.ContentType);

        readStream.pipe(res);
      }
    });
  },
  'list' : (req, res) =>{
    let storageType = req.params.storage;
    let prefix = req.params.prefix;

    switch(storageType){
      case "db":
      fileServer.getFileList((err, data) =>{
        if(err){
          console.log(err);
          res.redirect('/');
        }
        else{
          res.json(data);
        }
      });
      break;
      case "s3":
      fileServer.getFileListS3({'dir' : `${prefix}/`}, (err, data) =>{
        if(err){
          console.log(err);
          res.redirect('/');
        }
        else{
          let result = [];
          for(i in data.Contents) result.push(data.Contents[i].Key);
          res.json(result);
        }
      })
      break;
      case "exp":
      fileServer.getFileList((err, rows) =>{
        if(err) return null;
        else{
          let listFromDB = [];

          for(i in rows){
            let r = rows[i];
            let d = r.attachment;
            d = JSON.parse(d);

            for(j in d) listFromDB.push(d[j]);
          }

          fileServer.getFileListS3({'dir' : 'db/'}, (err, data) =>{
            if(err) return console.log(err);
            else{
              let listFromS3 = [];
              for (i in data.Contents){
                if(data.Contents[i].Key.split('/')[1].length > 1) listFromS3.push(data.Contents[i].Key);
              }

              fileServer.getFileListS3({'dir' : 'board/'}, (err, data) =>{
                if(err) return console.log(err);
                else{
                  for (i in data.Contents){
                    if(data.Contents[i].Key.split('/')[1].length > 1) listFromS3.push(data.Contents[i].Key);
                  }

                  let listExpired = listFromS3.filter((i) =>{ return listFromDB.indexOf(i) < 0;});

                  let result = {
                      'db' : listFromDB,
                      's3' : listFromS3,
                      'expired' : listExpired
                  };

                  res.json(result);
                }
              });
            }
          });
        }
      });
      break;
      default:
      res.redirect('/');
      break;
    }
  }
}

exports.post = {
  'client' : {
    'upload' : (req, res) =>{
      uploadController({'dir' : 'db'}, req, res, (err, data) =>{
        if(err) res.send(err);
        else res.send(data.key);
      });
    }
  },
  'board' : {
    'upload' : (req, res) =>{
      uploadController({'dir' : 'board'}, req, res, (err, data) =>{
        if(err) res.send(err);
        else res.send(data.key);
      });
    }
  }
}

var uploadController = (opt, req, res, cb) => {
  let dir = opt.dir;
  let file = req.file;
  let response = {
    'head' : {},
    'body' : "No file object in the request"
  };
  response.head.status = false;
  response.head.err = errs.improperRequest;
  if(!file) {
    return res.json(response);
  }
  let params = {
    'fieldname' : file.fieldname,
    'key' : fileServer.util.encode(file.originalname),
    'mimetype' : file.mimetype,
    'buffer' : file.buffer,
    'dir' : dir + '/'
  };

  fileServer.upload(params, (err, data) =>{
    if(err) cb(errs.internalServerError, []);
    else cb(err, data);
  });
}

var downloadController = (opt) => {
  let key = opt.key;
  let dest = opt.dest;
  let endsWhen = opt.endsWhen;
  let end = opt.end;
  let params = {
    'key' : key
  };
  fileServer.download(params, (err, data) =>{
    if(err) dest.push('error occurs in getting object');
    else{
      data.id = opt.key;
      dest.push(data);
      if(dest.length == endsWhen) end();
      else return;
    }
  });
}
