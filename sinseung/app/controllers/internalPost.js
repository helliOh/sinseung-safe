const request = require('request');

const port = '3000';

module.exports = {
	'public' : {
		'addCompany' : (req, res, next) =>{//회원가입 시에도 참고하므로 이 URL은 POST 보안처리(권한에 대한 배타성 제공)를 하지 않습니다.
			request.post({
				'url' :'http://13.209.108.106:' + port + '/config/company'},
				(error, response, body) =>{
				if(!req.custom) req.custom = {};
				var tmp = JSON.parse(body); //unify the keys
				for(i in tmp.body){
					tmp.body[i].number = tmp.body[i].com_id;
					tmp.body[i].value = tmp.body[i].com_name;
					delete tmp.body[i].com_id;
					delete tmp.body[i].com_name;
				}
				req.custom.company = tmp;
				next();
			});
		}
	},
	'db' : {
		'addDBType' : (req, res, next) =>{
			request.post({
				'url' :'http://13.209.108.106:' + port + '/client/search/dbType',
				'headers': {
					 'Authorization' : 'Basic ' + req.user.token
					 }
				 }, (error, response, body) =>{
				if(!req.custom) req.custom = {};
				var tmp = JSON.parse(body); //unify the keys
				for(i in tmp.body){
					tmp.body[i].number = tmp.body[i].c_db_type_no;
					tmp.body[i].value = tmp.body[i].c_db_type_name;
					delete tmp.body[i].c_db_type_no;
					delete tmp.body[i].c_db_type_name;
				}
				req.custom.dbType = tmp;
				next();
			});
		},
		'addLocalType' : (req, res, next) =>{
			request.post({
				'url' :'http://13.209.108.106:' + port + '/client/search/localType',
				'headers': {
					 'Authorization' : 'Basic ' + req.user.token
					 }
				 }, (error, response, body) =>{
				if(!req.custom) req.custom = {};
				var tmp = JSON.parse(body); //unify the keys
				req.custom.localType = tmp;
				next();
			});
		},
		'addClassification' : (req, res, next) =>{
			request.post({
				'url' :'http://13.209.108.106:' + port + '/client/search/classification',
				'headers': {
					 'Authorization' : 'Basic ' + req.user.token
					 }
				 }, (error, response, body) =>{
				if(!req.custom) req.custom = {};
				var tmp = JSON.parse(body); //unify the keys
				for(i in tmp.body){
					tmp.body[i].number = tmp.body[i].class_no;
					tmp.body[i].value = tmp.body[i].class_name;
					delete tmp.body[i].class_no;
					delete tmp.body[i].class_name;
				}
				req.custom.classification = tmp;
				next();
			});
		},
		'addInfo' : (req, res, next) =>{
			request.post({
				'url' :'http://13.209.108.106:' + port + '/client/init/info',
				'headers': {
					 'Authorization' : 'Basic ' + req.user.token
					 }
				 },
				(error, response, body) =>{
				if(!req.custom) req.custom = {};
				req.custom.info = JSON.parse(body);
				next();
			});
		},
		'addEntno' : (req, res, next) =>{
			request.post({
				'url' :'http://13.209.108.106:' + port + '/client/init/entno',
				'headers': {
					 'Authorization' : 'Basic ' + req.user.token
					 }
				 },
				(error, response, body) =>{
				if(!req.custom) req.custom = {};
				req.custom.ent_no = JSON.parse(body);
				next();
			});
		},
		'addDateList' : (req, res, next) =>{
			request.post({
				'url' :'http://13.209.108.106:' + port + '/client/search/commission/dateList',
				'headers': {
					 'Authorization' : 'Basic ' + req.user.token
					 }
				 },
				(error, response, body) =>{
				if(!req.custom) req.custom = {};
				req.custom.dateList = JSON.parse(body);
				next();
			});
		},
		'addDBTypeData' : (req, res, next) =>{
			request.post({
				'url' :'http://13.209.108.106:' + port + '/client/search/commission/dbTypeData/latest',
				'headers': {
					 'Authorization' : 'Basic ' + req.user.token
					 }
				 },
				(error, response, body) =>{
				if(!req.custom) req.custom = {};
				req.custom.dbTypeData = JSON.parse(body);
				next();
			});
		},
		'addAccount' : (req, res, next) =>{
			request.post({
				'url' :'http://13.209.108.106:' + port + '/client/search/commission/account/latest',
				'headers': {
					 'Authorization' : 'Basic ' + req.user.token
					 }
				 },
				(error, response, body) =>{
				if(!req.custom) req.custom = {};
				req.custom.account = JSON.parse(body);
				next();
			});
		}
	},
	'home' : {
		'addNewId' : (req, res, next) =>{
			request.post({
				'url' :'http://13.209.108.106:' + port + '/member/get/new',
				 }, (error, response, body) =>{
				if(!req.custom) req.custom = {};
				req.custom.newId = JSON.parse(body);
				next();
			});
		},
		'addBoardIndex' : (req, res, next) =>{
			request.post({
				'url' :'http://13.209.108.106:' + port + '/index/board',
				'headers': {
					 'Authorization' : 'Basic ' + req.user.token
					 }
				 }, (error, response, body) =>{
				if(!req.custom) req.custom = {};
				req.custom.board = JSON.parse(body);
				next();
			});
		},
		'addBoardCategoryIndex' : (req, res, next) =>{
			request.post({
				'url' :'http://13.209.108.106:' + port + '/board/category/index',
				'headers': {
					 'Authorization' : 'Basic ' + req.user.token
				 },
				 'json' : {
					 'category' : req.params.category
				 },
				 }, (error, response, body) =>{
				if(!req.custom) req.custom = {};
				req.custom.board = body;
				next();
			});
		},
		'addArticle' : (req, res, next) =>{
			if(!req.params.id || isNaN(parseInt(req.params.id))){
				if(req.params.id == 'new'){
					if(!req.custom) req.custom = {};
					req.custom.article = {};
					req.custom.comments = {};
					next();
				}
				else res.rediret('/404');
			}
			else{
				request.post({
				'url' :'http://13.209.108.106:' + port + '/board/article',
				'headers': {
					 'Authorization' : 'Basic ' + req.user.token
				 },
				 'json' : {'bd_no' : req.params.id}
				 }, (error, response, body) =>{
				if(!req.custom) req.custom = {};
				req.custom.article = body.body.article[0];
				req.custom.comments = body.body.comments;
				next();
				});
			}
		},
		'verifyCategory' : (req, res, next) =>{
			request.post({
				'url' :'http://13.209.108.106:' + port + '/board/category/verify',
				'headers': {
					 'Authorization' : 'Basic ' + req.user.token
					 }
				 }, (error, response, body) =>{
				if(!req.custom) req.custom = {};
				let categories = JSON.parse(body).body;
				let category = req.params.category;
				let pass = false;

				for (i in categories){
					let c = categories[i].bd_category;
					if(c == category) pass = true;
				}

				if(pass) return next();
				else return res.redirect('/');
			});
		},
		'verifyArticle' : (req, res, next) =>{
			request.post({
				'url' :'http://13.209.108.106:' + port + '/board/article/verify',
				'headers': {
					 'Authorization' : 'Basic ' + req.user.token
					 }
				 }, (error, response, body) =>{
				if(!req.custom) req.custom = {};
				let articles = JSON.parse(body).body;
				let article = req.params.id;
				let pass = false;

				for (i in articles){
					let a = articles[i].bd_no;
					if(a == article) pass = true;
				}

				if(pass) return next();
				else if(article == 'new') return next();
				else return res.redirect('/');
			});
		},
		'addSchedule' : (req, res, next) =>{
			request.post({
				'url' :'http://13.209.108.106:' + port + '/schedule',
				'headers': {
					 'Authorization' : 'Basic ' + req.user.token
					 }
				 }, (error, response, body) =>{
				if(!req.custom) req.custom = {};
				req.custom.schedule = JSON.parse(body);
				next();
			});
		}
	},
	"admin" : {
		"addMember" : (req, res, next) =>{
			request.post({
				'url' :'http://13.209.108.106:' + port + '/member/info',
				'headers': {
					 'Authorization' : 'Basic ' + req.user.token
					 }
				 }, (error, response, body) =>{
				if(!req.custom) req.custom = {};
				req.custom.member = JSON.parse(body);
				next();
			});
		},
		"addUploadStatus" : (req, res, next) =>{
			request.post({
				'url' :'http://13.209.108.106:' + port + '/payment/upload/status',
				'headers': {
					 'Authorization' : 'Basic ' + req.user.token
					 }
				 }, (error, response, body) =>{
				if(!req.custom) req.custom = {};
				req.custom.status = JSON.parse(body);

				next();
			});
		},
		"addUnsyncedMeta" : (req, res, next) =>{
			request.post({
				'url' :'http://13.209.108.106:' + port + '/payment/search/unsynced/meta',
				'headers': {
					 'Authorization' : 'Basic ' + req.user.token
					 }
				 }, (error, response, body) =>{
				if(!req.custom) req.custom = {};
				req.custom.unsyncedDate = JSON.parse(body);
				next();
			});
		},
	},
}
