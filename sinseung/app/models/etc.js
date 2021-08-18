const mysql = require('mysql');

const inmemory = require('../../lib/inMemory');
const excelParser = require('../../lib/excelParser');
const DB = require('../../config/database');
const errs = require('../../config/errors');

const member = mysql.createConnection(DB.member);
const conn = mysql.createConnection(DB.etc);


module.exports = {
  "board" : {
    "selectArticleId" : (cb) =>{
      conn.query('select bd_no from board', (err, rows, fields) =>{
        if(err){
          console.log(err);
          cb(errs.internalServerError, rows);
        }
        else cb(err, rows);
      });
    },
    "selectArticle" : (no, cb) =>{//게시판 CRUD - Read
      if(no == 'new') cb(null, null);
      let query = `select * from board where bd_no=${conn.escape(no)};`
                + `select * from comment where cmt_board=${conn.escape(no)}`;
      conn.query(query, (err, rows, fields) =>{
        if(err){
          console.log(err);
          cb(errs.internalServerError, rows);
        }
        else cb(err, rows);
      });
    },
    'editArticle' : (params, cb) =>{//게시판 CRUD - Create / Update
      getAuthListBoard(params, (err, list) =>{
        if(err) return cb(errs.unauthorizedUser, null);
        else if(!list.isOwner){
          if(!(list.Admin || list.isSuperAdmin)) return cb(errs.unauthorizedUser, null);
        }

        let query = `insert into board(${params.bd_no? 'bd_no, ' : ''}created_at, bd_category, bd_name, bd_contents, bd_head_anchor, bd_attachment, bd_mb_no, bd_mb_name) `
                  + `values(${params.bd_no? conn.escape(params.bd_no) + ', ' : ''}now(), ${conn.escape(params.bd_category)}, ${conn.escape(params.bd_name)}, ${conn.escape(params.bd_contents)}, ${conn.escape(params.bd_head_anchor)}, ${conn.escape(params.bd_attachment)}, ${conn.escape(params.bd_mb_no)}, ${conn.escape(params.bd_mb_name)}) `
                  + `on duplicate key update `
                  + `created_at=values(created_at), bd_category=values(bd_category), bd_name=values(bd_name), bd_contents=values(bd_contents), bd_head_anchor=values(bd_head_anchor), bd_attachment=values(bd_attachment), bd_mb_no=values(bd_mb_no), bd_mb_name=values(bd_mb_name)`
        // console.log(query);
        conn.query(query, (err, rows, fields) =>{
          if(err){
            console.log(err);
            cb(errs.internalServerError, rows);
          }
          else cb(err, rows);
        });
      });
    },
    'deleteArticle' : (params, cb) =>{//게시판 CRUD - Delete
      getAuthListBoard(params, (err, list) =>{
        if(err) return cb(errs.unauthorizedUser, null);
        else if(!list.isOwner){
          if(!(list.Admin || list.isSuperAdmin)) return cb(errs.unauthorizedUser, null);
        }

        let query = `delete from comment where cmt_board=${params.bd_no};`
                  + `delete from board where bd_no=${params.bd_no};`;

        conn.query(query, (err, rows, fields) =>{
          if(err){
            console.log(err);
            cb(errs.internalServerError, rows);
          }
          else cb(err, rows);
        });
      });
    },
    'editComment' : (params, cb) =>{
      getAuthListComment(params, (err, list) =>{
        if(err) return cb(errs.unauthorizedUser, null);
        else if(!list.isOwner){
          if(!(list.Admin || list.isSuperAdmin)) return cb(errs.unauthorizedUser, null);
        }

        let query = `insert into comment(${params.cmt_no? 'cmt_no, ' : ''}created_at, cmt_board, cmt_contents, cmt_mb_no, cmt_mb_name) `
                  + `values(${params.cmt_no? conn.escape(params.cmt_no) + ', ' : ''}now(), ${conn.escape(params.cmt_board)}, ${conn.escape(params.cmt_contents)}, ${conn.escape(params.cmt_mb_no)}, ${conn.escape(params.cmt_mb_name)}) `
                  + `on duplicate key update `
                  + `created_at=values(created_at), cmt_board=values(cmt_board), cmt_contents=values(cmt_contents), cmt_mb_no=values(cmt_mb_no), cmt_mb_name=values(cmt_mb_name)`

        conn.query(query, (err, rows, fields) =>{
          if(err){
            console.log(err);
            cb(errs.internalServerError, rows);
          }
          else cb(err, rows);
        });
      });
    },
    'deleteComment' : (params, cb) =>{
      getAuthListComment(params, (err, list) =>{
        if(err) return cb(errs.unauthorizedUser, null);
        else if(!list.isOwner){
          if(!(list.Admin || list.isSuperAdmin)) return cb(errs.unauthorizedUser, null);
        }

        conn.query(`delete from comment where cmt_no=${params.cmt_no}`, (err, rows, fields) =>{
          if(err){
            console.log(err);
            cb(errs.internalServerError, rows);
          }
          else cb(err, rows);
        });
      });
    },
    "selectBoardIndex" : (cb) =>{//메인 페이지에 표시할 게시물 20개를 조회합니다. 상단 고정 게시물을 우선합니다.
      conn.query('select bd_no, created_at, bd_category, bd_name, bd_head_anchor, bd_mb_name from board where bd_category="notice" order by bd_head_anchor desc, bd_no desc', (err, rows, fields) =>{
        if(err){
          console.log(err);
          cb(errs.internalServerError, rows);
        }
        else cb(err, rows);
      });
    },
    'selectCategory' : (cb) =>{//메인 페이지에 표시할 게시물 20개를 조회합니다. 상단 고정 게시물을 우선합니다.
      conn.query('select distinct(bd_category) as bd_category from board', (err, rows, fields) =>{
        if(err){
          console.log(err);
          cb(errs.internalServerError, rows);
        }
        else cb(err, rows);
      });
    },
    "selectBoardCategoryIndex" : (category, cb) =>{//메인 페이지에 표시할 게시물 20개를 조회합니다. 상단 고정 게시물을 우선합니다.
      conn.query(`select bd_no, created_at, bd_category, bd_name, bd_head_anchor, bd_mb_name from board where bd_category=${conn.escape(category)}order by bd_head_anchor desc, bd_no desc`, (err, rows, fields) =>{
        if(err){
          console.log(err);
          cb(errs.internalServerError, rows);
        }
        else cb(err, rows);
      });
    },
  },
  "schedule" : {
    "selectSchedule" : (cb) =>{//일정 정보를 조회합니다.
      conn.query('select * from schedule order by schd_start_date, schd_start_time', (err, rows, fields) =>{
        if(err){
          console.log(err);
          cb(errs.internalServerError, rows);
        }
        else cb(err, rows);
      });
    },
    'editSchedule' : (params, cb) =>{
      getAuthListSchedule(params, (err, list) =>{
        if(err) return cb(errs.unauthorizedUser, null);
        else if(!list.isOwner){
          if(!(list.Admin || list.isSuperAdmin)) return cb(errs.unauthorizedUser, null);
        }

        let query = `insert into schedule(${params.schd_no? 'schd_no, ' : ''}schd_company, schd_start_date, schd_end_date, schd_start_time, schd_end_time, schd_contents, schd_mb_no, schd_mb_name) `
                  + `values(${params.schd_no? conn.escape(params.schd_no) + ',' : ''} ${conn.escape(params.schd_company)}, ${conn.escape(params.schd_start_date)}, ${conn.escape(params.schd_end_date)}, ${conn.escape(params.schd_start_time)}, ${conn.escape(params.schd_end_time)}, ${conn.escape(params.schd_contents)}, `
                  + `${conn.escape(params.schd_mb_no)}, ${conn.escape(params.schd_mb_name)})`
                  + `on duplicate key update `
                  + `schd_company=values(schd_company), schd_start_date=values(schd_start_date), schd_end_date=values(schd_end_date), schd_start_time=values(schd_start_time), schd_end_time=values(schd_end_time), schd_contents=values(schd_contents), schd_mb_no=values(schd_mb_no), schd_mb_name=values(schd_mb_name)`

        conn.query(query, (err, rows, fields) =>{
          if(err){
            console.log(err);
            cb(errs.internalServerError, rows);
          }
          else cb(err, rows);
        });
      });
    },
    'deleteSchedule' : (params, cb) =>{
      getAuthListSchedule(params, (err, list) =>{
        if(err) return cb(errs.unauthorizedUser, null);
        else if(!list.isOwner){
          if(!(list.Admin || list.isSuperAdmin)) return cb(errs.unauthorizedUser, null);
        }

        conn.query(`delete from schedule where schd_no=${params.schd_no}`, (err, rows, fields) =>{
          if(err){
            console.log(err);
            cb(errs.internalServerError, rows);
          }
          else cb(err, rows);
        });
      });
    },
  },
  'escape' : (value) =>{
    return conn.escape(value);
  },
}

let getAuthListBoard = (params, cb) =>{
  let user = params.user.mb_no;
  let source = params.bd_no;
  if(!source) return cb(null, {isOwner : true});
  conn.query(`call getAuth_board(${conn.escape(source)}, ${conn.escape(user)})`, (err, rows, fields) =>{
    if(err){
      console.log(err);
      cb(errs.internalServerError, null);
    }
    else cb(err, rows[0][0]);
  });
}

let getAuthListComment= (params, cb) =>{
  let user = params.user.mb_no;
  let source = params.cmt_no;
  if(!source) return cb(null, {isOwner : true});
  conn.query(`call getAuth_comment(${conn.escape(source)}, ${conn.escape(user)})`, (err, rows, fields) =>{
    if(err){
      console.log(err);
      cb(errs.internalServerError, null);
    }
    else cb(err, rows[0][0]);
  });
}

let getAuthListSchedule = (params, cb) =>{
  let user = params.user.mb_no;
  let source = params.schd_no;
  if(!source) return cb(null, {isOwner : true});
  conn.query(`call getAuth_schedule(${conn.escape(source)}, ${conn.escape(user)})`, (err, rows, fields) =>{
    if(err){
      console.log(err);
      cb(errs.internalServerError, null);
    }
    else cb(err, rows[0][0]);
  });
}
