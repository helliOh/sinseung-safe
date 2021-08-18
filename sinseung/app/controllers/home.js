const numeral = require('numeral');
const bcrypt = require('bcrypt-nodejs');
const dateFormat = require('dateformat');
const member = require('../models/member');
const etc = require('../models/etc');
const errs = require('../../config/errors');

exports.get = {
		'home' : (req, res) =>{
			res.render('index.ejs', {
				title: 'main::신승CNS',
				user: req.user,
				company: req.custom.company,
				board: req.custom.board,
				schedule: req.custom.schedule
			});
		},
		"mypage" : (req, res) =>{
			res.render('mypage.ejs', {
				title: '마이페이지::신승CNS',
				user: req.user
			});
		},
		'signup' : (req, res) =>{
			res.render('signup.ejs', {
				title: '회원가입::신승CNS',
				newId : req.custom.newId,
				company : req.custom.company
			})
		},
		'login' : (req, res) =>{
			if(req.isAuthenticated()) res.redirect('/main');
			res.render('login.ejs', {
				title: '로그인::신승CNS',
				user: req.user
			});
		},
		'board' : (req, res) =>{
			let category = req.params.category;
			if(!category) res.redirect('/');

			res.render('board/index.ejs', {
				title: '게시판::신승CNS',
				user: req.user,
				board: req.custom.board,
				category: category,
			});
		},
		'boardDetail' : (req, res) =>{
			let category = req.params.category;
			let id = req.params.id;

			if(!category) return res.redirect('/');
			else if(!id || id == 'new') return res.redirect('/board/' + category);

			switch(category){
				case "notice"://댓글 table
					return res.render('board/article.ejs', {
						title: '게시판::신승CNS',
						user: req.user,
						article: req.params.id != 'new' ? req.custom.article : null,//info of certain article
						comments: null,
						category: category,
						id : id,
					});
					break;
				case "qna"://댓글 table
					return res.render('board/article.ejs', {
						title: 'Q&A::신승CNS',
						user: req.user,
						article: req.params.id != 'new' ? req.custom.article : null,//info of certain article
						comments: null,
						category: category,
						id : id,
					});
					break;
				case "archive":
					return res.render('board/article.ejs', {
						title: '자료실 게시물 작성::신승CNS',
						user: req.user,
						article: req.params.id != 'new' ? req.custom.article : null,//info of certain article
						comments: null,//req.custom.comments still has comments
						category: category,
						id : id,
					});
				default:
					return res.redirect('/' + category);
				break;
			}
		},
		'boardEdit' : (req, res) =>{
			let category = req.params.category;
			let id = req.params.id;

			if(!category) return res.redirect('/');
			else if(!id) return res.redirect('/board/' + category);

			switch(category){
				case "notice"://댓글 table
					return res.render('board/edit.ejs', {
					title: '게시글 작성::신승CNS',
					user: req.user,
					article: req.params.id != 'new' ? req.custom.article : null,//info of certain article
					comments: null,//req.custom.comments still has comments
					category: category,
					id : id,
				});
				break;
				case "qna":
					return res.render('board/edit.ejs', {
						title: '게시글 작성::신승CNS',
						user: req.user,
						article: req.params.id != 'new' ? req.custom.article : null,//info of certain article
						comments: null,//req.custom.comments still has comments
						category: category,
						id : id,
					});
				break;
				case "archive":
					return res.render('board/edit.ejs', {
						title: '게시글 작성::신승CNS',
						user: req.user,
						article: req.params.id != 'new' ? req.custom.article : null,//info of certain article
						comments: null,//req.custom.comments still has comments
						category: category,
						id : id,
					});
				break;
				default:
					return res.redirect('/' + category);
				break;
			}
		},
		// 'schedule' : (req, res) =>{
		// 	res.render('shedule.ejs', {
		// 		title: '회원가입::신승CNS'
		// 	});
		// }
}

exports.post = {
	'signup' : (req, res) =>{
		let data = {
            'mb_id' : req.body.id,
            'mb_pw' : req.body.password,
            'mb_name': req.body.name,
            'mb_email' : req.body.email,
            'mb_birth' : null,
            'mb_company' : req.body.company,
            'mb_income_class' : req.body.income_class,
            'mb_level' : 5,
            'mb_active' : 1,
            'mb_auth' : 0
        };
        if(req.body.birth) data.mb_birth = req.body.birth;
        if(req.body.level) data.mb_level = req.body.level;

				member.signup.signup(data, (err, newId) =>{//model - member 참고
					var result = {
						'head' : {},
						'body' : newId,
					};
					if(err){
						result.head.status = false;
						result.head.err = err;
					}
					else result.head.status = true;
					res.json(result);
        });
	},
	'verifyId' : (req, res) =>{
		let ID = req.body.id;
		member.signup.verifyId(ID,
			() =>{//on fail
				res.json(false);
			},
			() =>{//on success
				res.json(true);
			});
	},
	'logout' : (req, res) =>{
		// console.log(req.user.mb_id + " logged out ("+new Date().getTime()+")");
		req.logout();
		res.redirect('/login');
	},
	'getArticle' : (req, res) =>{
		let no = req.body.bd_no;

		etc.board.selectArticle(no, (err, data) =>{
			let result = {
				'head' : {},
				'body' : null
			};
			if(err){
				result.head.status = false;
				result.head.err = err;
				console.log(err);
			}
			else{
				result.head.status = true;
				if(!result.body) result.body = {};
				result.body.article = data[0];//first query that select certain article
				result.body.comments = data[1];//second query that select comments where
			}
			res.json(result);
		});
	},
	'editArticle' : (req, res) =>{
		let data_in = req.body;

		if(data_in.bd_category){
			switch(data_in.bd_category){
				case '공지사항':
				data_in.bd_category = 'notice';
				break;
				case 'Q&A':
				data_in.bd_category = 'qna';
				break;
				case '자료실':
				data_in.bd_category = 'archive';
				break;
				default:
				break;
			}
		}
		// console.log(data_in);
		data_in.bd_head_anchor = (data_in.bd_head_anchor == '' ) ? 0 : data_in.bd_head_anchor;
		data_in.bd_head_anchor = (data_in.bd_head_anchor == 'true' ) ? 1 : 0;

		if(data_in.bd_no == '') delete data_in.bd_no;
		data_in.user = req.user;

		etc.board.editArticle(data_in, (err, data) =>{
			let result = {
				'head' : {},
				'body' : null
			};
			if(err){
				result.head.status = false;
				result.head.err = err;
				console.log(err);
			}
			else{
				result.head.status = true;
				result.body = {};
				result.body.url = `/board/${data_in.bd_category}/${data.insertId}`;
				console.log(result.body.url);
			}
			res.json(result);
		});
	},
	'deleteArticle' : (req, res) =>{
		let params = {
			'user' : req.user,
			'bd_no' : req.body.bd_no
		};

		etc.board.deleteArticle(params, (err, data) =>{
			let result = {
				'head' : {},
				'body' : data
			};
			if(err){
				result.head.status = false;
				result.head.err = err;
				console.log(err);
			}
			else result.head.status = true;
			res.json(result);
		});
	},
	'editComment' : (req, res) =>{
		let data_in = req.body;
		if(data_in.cmt_no == '') delete data_in.cmt_no;
		data_in.cmt_board = data_in.bd_no;
		data_in.user = req.user;
		data_in.cmt_mb_no = req.user.mb_no;
		data_in.cmt_mb_name = req.user.mb_name;

		etc.board.editComment(data_in, (err, data) =>{
			let result = {
				'head' : {},
				'body' : null
			};
			if(err){
				result.head.status = false;
				result.head.err = err;
				console.log(err);
			}
			else{
				result.head.status = true;
				result.body = {};
				result.body.url = `/board/${data_in.bd_category}/${data.insertId}`;
			}
			res.json(result);
		});
	},
	'deleteComment' : (req, res) =>{
		let data_in = req.body;

		if(data_in.cmt_no == '') delete data_in.cmt_no;
		data_in.user = req.user;
		data_in.cmt_mb_no = req.user.mb_no;
		data_in.cmt_mb_name = req.user.mb_name;

		etc.board.deleteComment(data_in, (err, data) =>{
			let result = {
				'head' : {},
				'body' : null
			};
			if(err){
				result.head.status = false;
				result.head.err = err;
				console.log(err);
			}
			else{
				result.head.status = true;
				result.body = {};
				result.body.url = `/board/${data_in.bd_category}/${data.insertId}`;
			}
			res.json(result);
		});
	},
	'getBoardIndex' : (req, res) =>{
		etc.board.selectBoardIndex((err, data) =>{
			let result = {
				'head' : {},
				'body' : data
			};
			if(err){
				result.head.status = false;
				result.head.err = err;
				console.log(err);
			}
			else result.head.status = true;
			res.json(result);
		});
	},
	'getBoardCategoryIndex' : (req, res) =>{
		let category = req.body.category;
		if(!category) res.json({'head' : {status : false}});

		etc.board.selectBoardCategoryIndex(category, (err, data) =>{
			let result = {
				'head' : {},
				'body' : data
			};
			if(err){
				result.head.status = false;
				result.head.err = err;
				console.log(err);
			}
			else result.head.status = true;
			res.json(result);
		});
	},
	'getCategory' : (req, res) =>{
		etc.board.selectCategory((err, data) =>{
			let result = {
				'head' : {},
				'body' : data
			};
			if(err){
				result.head.status = false;
				result.head.err = err;
				console.log(err);
			}
			else result.head.status = true;
			res.json(result);
		});
	},
	'getBoard' : (req, res) =>{
		etc.board.selectArticleId((err, data) =>{
			let result = {
				'head' : {},
				'body' : data
			};
			if(err){
				result.head.status = false;
				result.head.err = err;
				console.log(err);
			}
			else result.head.status = true;
			res.json(result);
		});
	},
	'getSchedule' : (req, res) =>{
		etc.schedule.selectSchedule((err, data) =>{
			let result = {
				'head' : {},
				'body' : data
			};
			if(err){
				result.head.status = false;
				result.head.err = err;
				console.log(err);
			}
			else result.head.status = true;
			res.json(result);
		});
	},
	'editSchedule' : (req, res) =>{
		let data_in = req.body;
		if(data_in.schd_no == '') delete data_in.schd_no;
		data_in.user = req.user;
		data_in.schd_mb_no = req.user.mb_no;
		data_in.schd_mb_name = req.user.mb_name;

		etc.schedule.editSchedule(data_in, (err, data) =>{
			let result = {
				'head' : {},
				'body' : null
			};
			if(err){
				result.head.status = false;
				result.head.err = err;
				console.log(err);
			}
			else{
				result.head.status = true;
				result.body = {};
			}
			res.json(result);
		});
	},
	'deleteSchedule' : (req, res) =>{
		let data_in = req.body;

		if(data_in.schd_no == '') delete data_in.schd_no;
		data_in.user = req.user;
		data_in.schd_mb_no = req.user.mb_no;
		data_in.schd_mb_name = req.user.mb_name;

		etc.schedule.deleteSchedule(data_in, (err, data) =>{
			let result = {
				'head' : {},
				'body' : null
			};
			if(err){
				result.head.status = false;
				result.head.err = err;
				console.log(err);
			}
			else{
				result.head.status = true;
				result.body = {};
			}
			res.json(result);
		});
	},
	'mypage' : (req, res) =>{
		member.mypage.edit(req.body, (err, data) =>{
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
	'newId' : (req, res) =>{
		member.signup.newId((err, id) =>{
			let result = {
				'head' : {},
				'body' : id
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
