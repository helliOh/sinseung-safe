// 관리자 전용 기능
// let qs = require('querystring');
const numeral = require('numeral');
const bcrypt = require('bcrypt-nodejs');
const dateFormat = require('dateformat');

const member = require('../models/member');
const client = require('../models/client');
const admin = require('../models/admin');
const errs = require('../../config/errors');

exports.get = {
	"db":{
		"home" : (req, res) =>{
			let category = req.params.category;
			let data = {
				title: '관리자::신승CNS',
				category: category,
				user: req.user,
				dataPackage:{}
			};

			switch(category){
				case "client":
				data.title = '관리자::업체관리::신승CNS';
				data.dataPackage['dbType'] = req.custom.dbType;
				data.dataPackage['classification'] = req.custom.classification;
				data.dataPackage['result'] = req.custom.result;
				break;
				case "contract":
				data['title'] = '관리자::계약관리::신승CNS';
				break;
				case "company":
				data['title'] = '관리자::소속관리::신승CNS';
				data.dataPackage['company'] = req.custom.company;
				break;
				case "commission":
				data['title'] = '관리자::수수료관리::신승CNS';
				data.dataPackage['dbType'] = req.custom.dbType;
				data.dataPackage['dbTypeData'] = req.custom.dbTypeData;
				data.dataPackage['account'] = req.custom.account;
				data.dataPackage['dateList'] = req.custom.dateList;
				break;
				case "incometax":
				data['title'] = '관리자::근로소득세관리::신승CNS';
				data.dataPackage['dummy'] = [{'key' : 'value'}];
				break;
				default:
				break;
			}

			res.render('admin/db.ejs', data);
		}
	},
	"member" : {
		"home" : (req, res) =>{
			let data = {
					title: '관리자::회원관리:신승CNS',
					user: req.user,
					dataPackage:{
						'member' : req.custom.member,
						'company' : req.custom.company
					}
				};
			res.render('admin/member.ejs', data);
		}
	}
}//get ends

exports.post = {

	"client" : {
		"editProps" : (req, res) =>{
			let type = req.body.type;
			let query_type = req.body.query;
			let no = req.body.number;
			let value = req.body.value;
			let user_id = req.user.mb_id;

			let keyColName = '';
			let valueColName = '';
			let table = '';
			let query = '';

			switch(type){
				case "dbType":
					table = 'ss_client_db_type_controller';
					keyColName = 'c_db_type_no';
					valueColName = 'c_db_type_name';
				break;
				case "classification":
					table = 'ss_client_classification';
					keyColName = 'class_no';
					valueColName = 'class_name';
				break;
				default:
				break;
			}

			switch(query_type){
				case "create":
				query = "insert into ";
				query = query + table;
				query = query + "(" + valueColName + ") ";
				query = query + "values(" + client.escape(value) + ")";
				break;
				case "change":
				query = "update " + table;
				query = query + " set " + valueColName + "=" + client.escape(value);
				query = query + " where " + keyColName + "=" + client.escape(no);
				break;
				case "delete":
				query = "delete from " + table;
				query = query + " where " + keyColName + "=" + client.escape(no);
				break;
				default:
				break;
			}

			client.admin.editProps(query, (err, data) =>{
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
		'downloadLog' : (req, res) =>{
			let no = req.body.ci_no;

			client.admin.downloadLog(no, (err, data) =>{
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
		}
	},
	"member" : {
		"info" : (req, res) =>{
			let params = req.body;
			member.admin.info(params, (err, data) =>{
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
		"editAuth" : (req, res) =>{
			let users = req.body.users;
			member.admin.editAuth(users, (err, data) =>{
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
		"edit" : (req, res) =>{
			let params = [req.body.mb_name, req.body.mb_birth, req.body.mb_email, req.body.mb_level, req.body.mb_company, req.body.mb_income_class, req.body.mb_position, req.body.mb_no];
			let myLvl = req.user.mb_level;
			if(req.body.mb_level <= req.user.mb_level) return res.json({'head' : { status : false, err : errs.unauthorizedUser}});

			member.admin.editInfo(params, (err, data) =>{
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
		'deactivateUser' : (req, res) =>{
			let no = req.body.mb_no;
			member.admin.deactivateUser(no, (err, data)=>{
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
		"resetPassword" : (req, res) =>{
			let no = req.body.mb_no;
			member.admin.resetPassword(no, (err, data)=>{
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
		}
	},
	"config" : {
		"company" : (req, res) =>{
			let user = req.user;
			admin.selectCompany((err, data)=>{
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
		"editCompany" : (req, res) =>{
			let query_type = req.body.query;
			let no = req.body.number;
			let value = req.body.value;
			let query = '';
			/*여기부터 작업하기*/
			switch(query_type){
				case "create":
				query = "insert into ss_company(com_name)";
				query = query + " values(" + admin.escape(value) + ")";
				break;
				case "change":
				query = "update ss_company";
				query = query + " set " + "com_name=" + admin.escape(value);
				query = query + " where com_id=" + admin.escape(no);
				break;
				case "delete":
				query = "delete from ss_company";
				query = query + " where com_id=" + admin.escape(no);
				break;
				default:
				break;
			}

			admin.editCompany(query, (err, data) =>{
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
		}
	},
	"commission" : {
		'editCommission' : (req, res) =>{
			let query_type = req.body.type;
			let date = req.body.date;
			let data = req.body.data;

			switch(query_type){
				case "create":
				query = "insert into ss_client_db_type(db_type_name, db_type_date, db_type_share, db_type_central_share, db_type_POS_share, db_type_program_share, db_type_head_officer_share, db_type_company_share, db_type_manager_share)";

				var tmpDBType = client.admin.queryGenerateEditCommission(data.dbType);
				query += ' values '
				for(i in tmpDBType.values) query += tmpDBType.values[i];
				query += ';';

				query += "insert into ss_client_account(acc_name, acc_date, acc_share, acc_company_share, acc_manager_share)";
				var tmpAccount = client.admin.queryGenerateEditCommission(data.account);
				query += ' values '
				for(i in tmpAccount.values) query += tmpAccount.values[i];
				query += ';';
				break;

				case "change":
				query = "insert into ss_client_db_type(db_type_no, db_type_name, db_type_date, db_type_share, db_type_central_share, db_type_POS_share, db_type_program_share, db_type_head_officer_share, db_type_company_share, db_type_manager_share)";

				var tmpDBType = client.admin.queryGenerateEditCommission(data.dbType);//set values of DB Type
				query += ' values '
				for(i in tmpDBType.values) query += tmpDBType.values[i];
				query += tmpDBType.dupOpt
							+ ';';

				query += "insert into ss_client_account(acc_no, acc_name, acc_date, acc_share, acc_company_share, acc_manager_share)";
				var tmpAccount = client.admin.queryGenerateEditCommission(data.account);//set values of Account
				query += ' values '
				for(i in tmpAccount.values) query += tmpAccount.values[i];
				query += tmpAccount.dupOpt
							+ ';';
				break;

				case "delete":
				query = 'delete from ss_client_db_type where db_type_date=' + client.escape(date) +';'
							+ 'delete from ss_client_account where acc_date=' + client.escape(date) +';';
				break;

				default:
				break;
			}
			client.admin.editCommssion(query, (err, data) =>{
				let result = {
					'head' : {},
					'body' : []
				};
				if(err){
					result.head.status = false;
					result.head.err = err;
				}
				else result.head.status = true;
				res.json(result);
			});
		}
	}
}

var inputHandlerInsert = (obj) =>{//delete keys in object which are empty and some encoding
	for (key in obj) if(obj[key] == '') obj[key] = null;
	return obj;
}
