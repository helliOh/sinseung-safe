//model - home
const mysql = require('mysql');
const DB = require('../../config/database');
const conn = mysql.createConnection(DB.member);
const bkfd2Password = require("pbkdf2-password");
const hasher = bkfd2Password();
const errs = require('../../config/errors');

module.exports = {
  //로그인과 관련된 쿼리 컨트롤
  'public' : {
    "search" : (data, cb) =>{
      let query = queryGenerateSelect(data);
      conn.query(query, (err, rows, fields) =>{
        if(err){
          console.log(err);
          cb(errs.internalServerError, []);
        }
        else cb(err, rows);
      });
    },
  },
  'login' : {
    'tryLogin' : (cb) =>{//form으로 온 정보에 의존해 세션 유지에 필요한 정보를 DB에 요청합니다.
      conn.query('select mb_no, mb_id, mb_pw, mb_salt, mb_name, mb_auth, mb_level from ss_member', (err, rows, fields) =>{
        if(err){
          console.log(err);
          //need something here
        }
        else cb(rows);
      });
    },
    'findUserById' : (no, cb) =>{//passport - deserialize를 위한 쿼리로 유저 id로 유저 객체를 조직하는 방법을 정의합니다.
      conn.query('select mb_no, date(created_at), mb_id, mb_name, mb_birth, mb_email, mb_auth, mb_level, mb_income_class, mb_position, mb_company from ss_member where mb_no=?', [no], (err, rows, fields) =>{
        if(err){
          console.log(err);
        }
        else {
          let user = rows[0];
          let date = user['date(created_at)'];
          user.created_at = date;
          delete user['date(created_at)'];
          cb(user);
        }
      });
    }
  },
  //회원가입과 관련된 쿼리 컨트롤
  'signup' : {
    //해당되는 아이디가 존재하는지 검증합니다.
    'newId' : (cb) =>{
      getNewId((err, data)=> {
        if(err) cb(errs.internalServerError, -1);
        else{
          let id = `sins${zeroPad(data.id.toString(), 4)}`;
          cb(err, id);
        }
      });

    },
    'verifyId' : (id, cb_duplicated, cb_verified) =>{
      conn.query('select * from ss_member where mb_id=?', [id], (err, rows, fields) =>{
        if(err){
          console.log(err);
          //cb_failed()
        }
        else {
          if(rows.length < 1) cb_verified();
          else cb_duplicated();
        }
      });
    },
    //회원가입 요청을 전송합니다.
    'signup' : (data, cb) =>{
      getNewId((err, newId) =>{
        if(err){
          console.log(err);
          cb(err, -1);
        }
        else{
          let query = 'insert into ss_member(created_at, mb_id, mb_salt, mb_pw, mb_name, mb_email, mb_birth, mb_income_class, mb_company, mb_auth, mb_active, mb_level)';
          let post_fix = ' values(now(),?,?,?,?,?,?,?,?,?,?,?)';
          query += post_fix;

          hasher({password : data.mb_pw}, (err, pass, salt, hash) =>{
            //hasher(opts, cb(err,password,salt,hash) :: pbkdf2-password 참고
            //opts에 salt 프로퍼티가 없을 경우 random hashing 값을 cb에 passing합니다.
            data.mb_id = `sins${zeroPad(newId.id.toString(), 4)}`;
            data.mb_salt = salt;
            data.mb_pw = hash;
            let values = [data.mb_id, data.mb_salt, data.mb_pw, data.mb_name, data.mb_email, data.mb_birth, data.mb_income_class, data.mb_company, data.mb_auth, data.mb_active, data.mb_level];

            conn.query(query, values, (err, result, fields) =>{
              if(err){
                console.log(err);
                cb(errs.internalServerError, null);
              }
              else cb(err, data.mb_id);
            });
          });
        }
      });
    }
  },
  "mypage" :{
    "edit" : (data, cb) =>{
      let query = 'update ss_member set ';
      let no = data.mb_no;
      let password = data.mb_password;
      let newPassword = data.new_password;
      let email = data.mb_email;

      query += 'mb_email="' + email + '"';

      if(password != ''){
        conn.query('select * from ss_member where mb_no=' + no, (err, rows, fields) =>{
          if(err){
            console.log(err);
            cb(errs.internalServerError, []);
          }
          else{
            let prevPassword = rows[0].mb_pw;
            let userSalt = rows[0].mb_salt;

            hasher({"password" : password, "salt" : userSalt}, (err, pass, salt, hash) =>{
                if(err){
                  console.log(err);
                  cb(errs.internalServerError, []);
                }
                if(hash != prevPassword) cb(errs.passwordFail, []);

                hasher({"password" : newPassword}, (err, pass, salt, hash) =>{
                    if(err){
                      console.log(err);
                      cb(errs.internalServerError, []);
                    }
                    query += ', mb_salt="' + salt + '", mb_pw="' + hash + '" where mb_no=' + no;

                    conn.query(query, (err, rows, fields) =>{
                      if(err){
                        console.log(err);
                        cb(errs.internalServerError, []);
                      }
                      else cb(err, rows);
                    });
                });
            });
          }
        });
      }
      else cb(null, []);
    }
  },
  'admin' : {
    "info" : (data, cb) =>{
      let query = queryGenerateSelect(data);
      conn.query(query, (err, rows, fields) =>{
        if(err){
          console.log(err);
          cb(errs.internalServerError, []);
        }
        else cb(err, rows);
      });
    },
    "editInfo" : (params, cb) =>{
      let query = 'update ss_member set mb_name=?, mb_birth=?, mb_email=?, mb_level=?, mb_company=?, mb_income_class=?, mb_position=? where mb_no=?';
      conn.query(query, params, (err, rows, fields) =>{
        if(err){
          console.log(err);
          cb(errs.internalServerError, []);
        }
        else cb(err, rows);
      });
    },
    "editAuth" : (data, cb) =>{
      let query = 'insert into ss_member(mb_no, created_at, mb_id, mb_salt, mb_pw, mb_name, mb_email, mb_active, mb_auth, mb_position, mb_income_class, mb_level, mb_company) ';
      let values = 'values ';
      let postfix = ' on duplicate key update mb_position = values(mb_position), mb_income_class = values(mb_income_class), mb_level = values(mb_level), mb_company = values(mb_company), mb_auth=1;';

      for(let i=0; i<data.length; i++){
        let eachData = data[i];
        let eachValue = '(';
        eachValue += conn.escape(eachData.mb_no) + ', now(), "tmp", "tmp", "tmp", ' + conn.escape(eachData.mb_name) + ', "tmp", 1, 1, ' + conn.escape(eachData.mb_position) + ', ' + conn.escape(eachData.mb_income_class) + ', ' + conn.escape(eachData.mb_level) + ', ' + conn.escape(eachData.mb_company) + '), ';
        values += eachValue;
         //on duplicated key 구문을 이용하여 mutiple row를 수정합니다.
         //실제로 수정되는 값은 postfix에 명시된 4개의 column과 mb_auth 입니다.
         //mb_auth는 1로 고정 수정되며, "tmp"로 채워지는 value들은 update되지 않습니다.
      }

      values = values.substr(0, values.length-2);
      query += values + postfix;

      conn.query(query, (err, rows, fields) =>{
        if(err){
          console.log(err);
          cb(errs.internalServerError, []);
        }
        else cb(err, rows);
      });
    },
    "resetPassword" : (no, cb) =>{
      hasher({password : "0000"}, (err, pass, salt, hash) =>{
        let query = 'update ss_member set mb_salt=' + conn.escape(salt) + ', mb_pw=' + conn.escape(hash) + ' where mb_no=' + conn.escape(no);

        conn.query(query, (err, rows, fields) =>{
          if(err){
            console.log(err);
            cb(errs.internalServerError, []);
          }
          else cb(err, rows);
        });
      });
    },
    "deactivateUser" : (no, cb) =>{
      conn.query('update ss_member set mb_active=0 where mb_no=' + conn.escape(no), (err, rows, fields) =>{
        if(err){
          console.log(err);
          cb(errs.internalServerError, []);
        }
        else cb(err, rows);
      });
    }
  }
}

let queryGenerateSelect = (data) =>{//업체 정보 조회에 대한 쿼리문을 데이터의 형태에 맞게 수정합니다.
  let where = false;
  let prefix = 'select mb_no, created_at, mb_id, mb_name, mb_birth, mb_email, mb_auth, mb_level, mb_active, mb_company, mb_income_class, mb_position from ss_member';
  if(!Object.keys(data).length) return prefix;
  let empty = true;
  for(i in data) if(data[i] != ''){empty = false; break;}
  if(empty) return prefix;
  let postfix = ' where ';

  if(data.mb_no){
    postfix += 'mb_no=' + conn.escape(data.mb_no) + ' and ';
    where = true;
  }
  if(data.mb_id){
    postfix += 'mb_id like' + conn.escape("%" + data.mb_id + "%") + ' and ';
    where = true;
  }
  if(data.mb_name){
    postfix += 'mb_name like' + conn.escape("%" + data.mb_name + "%") + ' and ';
    where = true;
  }
  if(data.mb_email){
    postfix += 'mb_email like' + conn.escape("%" + data.mb_email + "%") + ' and ';
    where = true;
  }
  if(data.mb_level){
    postfix += 'mb_level=' + conn.escape(data.mb_level) + ' and ';
    where = true;
  }
  if(data.mb_auth){
    postfix += 'mb_auth=' + conn.escape(data.mb_auth) + ' and ';
    where = true;
  }
  if(data.mb_birth){
    postfix += 'mb_birth=date("' + conn.escape(data.mb_birth) + '") and ';
    where = true;
  }
  if(data.created_at){
    postfix += 'created_at between "' + conn.escape(data.created_at) + ' 00:00:00.000" and "' + conn.escape(data.created_at) + ' 23:59:59.999" and ' ;
    where = true;
  }
  if(data.mb_income_class){
    postfix += 'mb_income_class like' + conn.escape("%" + data.mb_income_class + "%") + ' and ';
    where = true;
  }
  if(data.mb_position){
    postfix += 'mb_position like' + conn.escape("%" + data.mb_position + "%") + ' and ';
    where = true;
  }
  if(data.mb_company){
    postfix += 'mb_company like' + conn.escape("%" + data.mb_company + "%") + ' and ';
    where = true;
  }

  postfix = postfix.slice(0, postfix.length-5);//remove last " and " statement
  if(where) return prefix + postfix;
}

let getNewId = (cb) =>{
  // 개발자용 super admin ss_admin
  // 클라이언트용 super admin : sins0000 을 제외한 번호값
  conn.query(`select count(*) - 1 as id from ss_member`, (err, rows, fields) =>{
    let id = rows[0];
    if(err){
      console.log(err);
      cb(errs.internalServerError, rows);
    }
    else cb(err, id);
  });
}

let zeroPad = (str, width) =>{
    let padded = str;
    while(padded.length < width) padded = '0' + padded;
    return padded;
}
