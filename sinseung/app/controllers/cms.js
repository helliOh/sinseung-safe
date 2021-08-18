const stream = require('stream');
const inmemory = require('../../lib/inMemory');
const errs = require('../../config/errors');

const member = require('../models/member');
const client = require('../models/client');
const fileServer = require('../models/fileServer');
const cms = require('../models/cms');

const numeral = require('numeral');
const bcrypt = require('bcrypt-nodejs');
const dateFormat = require('dateformat');
const mime = require('mime-types');

exports.multer = fileServer.getSession();

exports.get = {
  'payment' : {
    'admin' : {
      'home' : (req, res) => {
        var category = req.params.category;
        var data = {
          title: '결제관리::신승CNS',
          category: category,
          user: req.user,
          dataPackage:{}
        };

        switch(category){
          case "overdue":
          data.title = '결제관리::연체관리::신승CNS';
          data.dataPackage['company'] = req.custom.company;
          break;
          case "upload":
          data.title = '결제관리::파일업로드::신승CNS';
          data.dataPackage['unsyncedDate'] = req.custom.unsyncedDate;
          data.dataPackage['status'] = req.custom.status;

          default:
          break;
        }

        res.render('payment/index.ejs', data);
      }
    }
  }
}

exports.post = {
  'payment' : {
    'middleWare' : {
      'euckr2utf' : (req, res, next) =>{
        if(!req.file) return next();
        let buffer = req.file.buffer;

        cms.middleWare.euckr2utf(buffer, (err, data) =>{
          req.file.buffer = data;
          next();
        });
      },
      'xlsx2Csv' : (req, res, next) =>{
        if(!req.file) return next();
        let fileName = req.file.originalname.split('.')[0];
        let ext = req.file.originalname.split('.')[1];
        let buffer = req.file.buffer;

        if(ext == 'csv' || ext == 'xls') return next();
        else
          cms.middleWare.xlsx2Csv(buffer, (err, data) =>{
            next();
          });
      },
    },
    'public' : {
      'getSynced' : (req, res) =>{
        let params = {
          'company' : req.body.company,
          'manager' : req.body.manager,
          'year' : req.body.year
        };
        for(key in params) if(params[key] == '') params[key] = null;

        cms.selectSynced(params, (err, data) =>{
    			var result = {
    				'head' : {},
    				'body' : data
    			};
    			if(err){
    				result.head.status = false;
    				result.head.err = err;
    			}
    			else result.head.status = true;
    			res.json(result);
    		});
      },
      'getCommission' : (req, res) =>{
        let params = {
          'date' : req.body.date.toString().replace(/\//gi, '-'),
          'mb_no' : req.body.mb_no,
          'user' : req.user
        }

        cms.selectCommission(params, (err, data) =>{
    			var result = {
    				'head' : {},
    				'body' : data
    			};
    			if(err){
    				result.head.status = false;
    				result.head.err = err;
    			}
    			else{
            result.head.status = true;
            let t = 0;

            // result.head.header.total = t;
            // result.head.header.sums = resultHeader;
            // result.head.header.businessTax = Math.round(Math.round(0.03 * t) / 10) * 10;
            // result.head.header.localTax = Math.round(Math.round(result.head.header.businessTax * 0.1) / 10) * 10;
            res.json(result);
          }
    		});
      },
      'downloadPayment' : (req, res) =>{
        let params = {
          'company' : req.body.company,
          'username' : req.body.username,
          'table' : req.body.table,
          'year' : req.body.year,
          'month' : req.body.month,
    			'csv' : req.body.csv
    		};

        cms.downloadPayment(params, (err, data) =>{
          let result = {
            'head' : {},
            'body' : {
              'url' : `http://13.209.108.106:3000/download/file/${data.key}`
            }
          };
          if(err){
            result.head.status = false;
            result.head.err = err;
          }
          else result.head.status = true;
          res.json(result);
        });
      },
      'downloadCommission' : (req, res) =>{
        let params = {
          'date' : req.body.date,
          'company' : req.body.company,
          'table' : req.body.table,
          'username' : req.body.username,
    			'csv' : req.body.csv
    		};
        cms.downloadCommission(params, (err, data) =>{
          let result = {
            'head' : {},
            'body' : {
              'url' : `http://13.209.108.106:3000/download/file/${data.key}`
            }
          };
          if(err){
            result.head.status = false;
            result.head.err = err;
          }
          else result.head.status = true;

          res.json(result);
        });
      },
    },
    'admin' : {
      'getUploadStatus' : (req, res) =>{
        cms.selectUploadStatus((err, data) =>{
    			var result = {
    				'head' : {},
    				'body' : data
    			};
    			if(err){
    				result.head.status = false;
    				result.head.err = err;
    			}
    			else result.head.status = true;

    			res.json(result);
    		});
      },
      'upload' : (req, res) =>{
        let buffer = req.file.buffer;

        cms.upload(buffer, (err, data) =>{
    			var result = {
    				'head' : {},
    				'body' : null
    			};
    			if(err){
    				result.head.status = false;
    				result.head.err = err;
    			}
    			else result.head.status = true;
          res.json(result);
    		});
      },
      'uploadTax' : (req, res) =>{
        let buffer = req.file.buffer;

        res.json('악');
      },
      'sync' : (req, res) =>{
        cms.sync((err, data) =>{
    			var result = {
    				'head' : {},
    				'body' : null
    			};
    			if(err){
    				result.head.status = false;
    				result.head.err = err;
    			}
    			else result.head.status = true;
    			res.json(result);
    		});
      },
      'getUnsynced' : (req, res) =>{
        let params = {
          'year' : req.body.year,
          'month' : req.body.month
        };

        cms.selectUnsynced(params, (err, data) =>{
    			var result = {
    				'head' : {},
    				'body' : data
    			};
    			if(err){
    				result.head.status = false;
    				result.head.err = err;
    			}
    			else result.head.status = true;
    			res.json(result);
    		});
      },
      'getUnsyncedMeta' : (req, res) =>{
        cms.selectUnsyncedMeta((err, data) =>{
    			var result = {
    				'head' : {},
    				'body' : data
    			};
    			if(err){
    				result.head.status = false;
    				result.head.err = err;
    			}
    			else result.head.status = true;

    			res.json(result);
    		});
      },
    },
  },
}
