const numeral = require('numeral');
const bcrypt = require('bcrypt-nodejs');
const dateFormat = require('dateformat');
const member = require('../models/member');
const client = require('../models/client');
const errs = require('../../config/errors');

exports.get = {
  'search' : (req, res) =>{
		res.render('clientManagement/index.ejs', {
			title: '업체DB조회::신승CNS',
			user: req.user,
			DBType: req.custom.dbType,
			localType : req.custom.localType,
			classification: req.custom.classification,
			info : req.custom.info,
      ent_no : req.custom.ent_no,
			result: req.custom.result,
      company: req.custom.company
		});
	}
}

exports.post = {
  'initializeInfo' : (req, res) =>{
    client.selectInitialInfo((err, data)=> {
			let result = {
				'head' : {},
				'body' : data
			};
			if(err){
				result.head.status = false;
				result.head.err = err;
			}
			else{
				result.head.status = true;

			}
			res.json(result);
		});
  },
	'initializeEntNo' : (req, res) =>{
    client.selectInitialEntNo((err, data)=> {
			let result = {
				'head' : {},
				'body' : data
			};
			if(err){
				result.head.status = false;
				result.head.err = err;
			}
			else{
				result.head.status = true;

			}
			res.json(result);
		});
  },
	'getInfo' : (req, res) =>{
		let data_in = null;
		if(req.body) data_in = req.body;
		data_in = inputHandlerSelect(data_in);
		data_in.user = req.user;
		client.selectInfo(data_in, (err, data)=> {
			let result = {
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
	'createInfo' : (req, res) =>{
		let data_in = null;

		if(req.body) data_in = req.body;
		inputHandlerInsert(data_in);
		data_in.user = req.user;
		client.insertInfo(data_in, (err, id)=> {
			let result = {
				'head' : {},
				'body' : [id]
			};
			if(err){
				result.head.status = false;
				result.head.err = err;
			}
			else result.head.status = true;
			res.json(result);
		});
	},
	'downloadInfo' : (req, res) =>{
		let params = {
			'name' : req.body.name,
			'csv' : req.body.csv
		};
    client.downloadInfo(params, (err, data) =>{
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
      console.log(result);
      res.json(result);
    });
	},
	'getDBType' : (req, res) =>{
		client.selectDBType((err, data) =>{
			let result = {
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
	'getLocalType' : (req, res) =>{
		client.selectLocalType((err, data) =>{
			let result = {
				'head' : {},
				'body' : data
			};
			if(err){
				result.head.status = false;
				result.head.err = err;
			}
			else{
				result.head.status = true;
				let packing = {};
				for(i in data){
					let sido = data[i].local_sido;
					let sigungu = data[i].local_sigungu;
					if(packing[sido] == null) packing[sido] = [sigungu];
					else packing[sido].push(sigungu);
					result.body = packing;
				}
			}
			res.json(result);
		});
	},
	'getClassification' : (req, res) =>{
		client.selectClass((err, data) =>{
			let result = {
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
	'getDateList' : (req, res) =>{
		client.selectDateList((err, data) =>{
			let result = {
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
	'getAccountLatest' : (req, res) =>{
		client.selectAccountLatest((err, data) =>{
			let result = {
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
	'getDBTypeDataLatest' : (req, res) =>{
		client.selectDBTypeDataLatest((err, data) =>{
			let result = {
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
		let date = req.body.date;

		client.selectCommission(date, (err, data) =>{
			let result = {
				'head' : {},
				'body' : {
					dataPackage : {
						'dbType' : data.dbType,
						'account' : data.account
					}
				}
			};
			if(err){
				result.head.status = false;
				result.head.err = err;
			}
			else result.head.status = true;
			res.json(result);
		});
	},//client ends
	'member' : {
		'search' : (req, res) =>{
			member.public.search(req.body, (err, users) =>{
				let result = {
					'head' : {},
					'body' : users
				};
				if(err){
					result.head.status = false;
					result.head.err = err;
				}
				else result.head.status = true;
				res.json(result);
			});
		}
	}//member ends
}//post ends

let inputHandlerInsert = (obj) =>{//delete keys in object which are empty and some encoding
	if(obj.ci_no) obj.ci_no = parseInt(obj.ci_no);
	for (key in obj){
		if(obj[key] == '') delete obj[key];
		else if(key == 'file-name' || key == 'file-url') delete obj[key];
		else if(key == 'ci_attachment'){//refining the data as a obj and stringify to insert as a column
			let files = JSON.parse(obj[key]);
			let tmp = {};
			for (fidx in files){
				let eachFile = files[fidx];
				for (e in eachFile) tmp[e] = eachFile[e];
			}
			obj.ci_attachment = JSON.stringify(tmp);
		}
	}
	return obj;
}

let inputHandlerSelect = (obj) =>{//delete keys in object which are empty and some encoding
	if(obj.ci_no) obj.ci_no = parseInt(obj.ci_no);
	for (key in obj) if(obj[key] == '') delete obj[key];
	return obj;
}

let inputHandlerExport = (arr) =>{//arr is an array of objects
	for (i in arr){
		let eachObj = arr[i];

		for(key in eachObj)
			if(key == 'ci_attachment' || key == 'ci_editor_no' || key == 'ci_no' || key == 'ci_manager_no' ||
				 key == 'ci_pre_manager_no' || key == 'ci_companion_no' || key == 'ci_local_manager_no' )
				 	delete eachObj[key];
	}
}
