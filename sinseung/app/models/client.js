const DB = require('../../config/database');
const errs = require('../../config/errors');

const inmemory = require('../../lib/inMemory');
const excelParser = require('../../lib/excelParser');
const fileServer = require('./fileServer');

const stream = require('stream')
const mysql = require('mysql');

const member = mysql.createConnection(DB.member);
const conn = mysql.createConnection(DB.client);
const log = mysql.createConnection(DB.log);


module.exports = {
  'selectInitialInfo' : (cb) =>{
    let query = `select * from ss_client_info order by created_at limit 100`;
    conn.query(query, (err, rows, fields) =>{
      if(err){
        console.log(err);
        cb(errs.internalServerError, []);
      }
      else cb(err, rows);
    });
  },
  'selectInitialEntNo' : (cb) =>{
    let query = `select ci_ent_no from ss_client_info where ci_ent_no is not null order by ci_ent_no`;
    conn.query(query, (err, rows, fields) =>{
      if(err){
        console.log(err);
        cb(errs.internalServerError, []);
      }
      else cb(err, rows);
    });
  },
  'selectInfo' : (data, cb) =>{//업체 정보를 조회합니다.
    let query = queryGenerateSelect(data);
    console.log(query);
    conn.query(query, (err, rows, fields) =>{
      if(err){
        console.log(err);
        cb(errs.internalServerError, []);
      }
      else cb(err, rows);
    });
  },
  'insertInfo' : (data, cb) =>{//업체 정보를 삽입합니다.
    if(data == null) return null;
    if(!data.user) cb(errs.unidentifiedUser, []);
    let query = queryGenerateInsert('ss_client_info', data);
    conn.query(query, (err, result, fields) =>{
      if(err){
        console.log(err);
        cb(errs.internalServerError, []);
      }
      else cb(err, result.insertId);
    });
  },
  'downloadInfo' : (data, cb) =>{//업체 정보를 삽입합니다.
    let today = new Date();
    let dd = today.getDate();
    let mm = today.getMonth()+1; //January is 0!
    let yyyy = today.getFullYear();

    let buffer = Buffer.from(data.csv.replace(/null/gi, ""));
    let uploadRequest = {
      'key' : fileServer.util.encode(`업체정보(${yyyy}_${mm}_${dd}).csv`),
      'dir' : 'client/',
      'mimetype' : 'text/csv',
      'buffer' : inmemory.encode(buffer)
    };

    fileServer.upload(uploadRequest, (err, result) =>{
      if(err){
        console.log(err);
        cb(errs.internalServerError, null);
      }
      else cb(null, result);
    });
  },
  'selectDBType' : (cb) =>{//업체 정보중 종류 열에 해당하는 원본 테이블을 조회합니다.
    conn.query('select * from ss_client_db_type_controller order by c_db_type_no', (err, rows, fields) =>{
      if(err){
        console.log(err);
        cb(errs.internalServerError, rows);
      }
      else cb(err, rows);
    });
  },
  'selectLocalType' : (cb) =>{
    conn.query('select * from ss_client_local_type order by local_no', (err, rows, fields) =>{
      if(err){
        console.log(err);
        cb(errs.internalServerError, rows);
      }
      else cb(err, rows);
    });
  },
  'selectClass' : (cb) =>{//업체 정보중 구분 열에 해당하는 원본 테이블을 조회합니다.
    conn.query('select * from ss_client_classification', (err, rows, fields) =>{
      if(err){
        console.log(err);
        cb(errs.internalServerError, rows);
      }
      else cb(err, rows);
    });
  },
  'selectDateList' : (cb) =>{
    conn.query('select distinct(acc_date) from ss_client_account order by acc_date DESC', (err, rows, fields) =>{
      if(err){
        console.log(err);
        cb(errs.internalServerError, rows);
      }
      else cb(err, rows);
    });
  },
  'selectAccountLatest' : (cb) =>{
    conn.query('select acc_no, acc_name, acc_date, acc_share, acc_company_share, acc_manager_share from ss_client_account order by acc_date DESC, acc_name ASC limit 8', (err, rows, fields) =>{
      if(err){
        console.log(err);
        cb(errs.internalServerError, rows);
      }
      else cb(err, rows);
    });
  },
  'selectDBTypeDataLatest' : (cb) =>{
    conn.query('set @cnt =(select count(*) from ss_client_db_type_controller);prepare STMT from "select * from ss_client_db_type order by db_type_date DESC, db_type_name ASC limit ?";execute STMT using @cnt;', (err, rows, fields) =>{
      if(err){
        console.log(err);
        cb(errs.internalServerError, rows);
      }
      else{
        rows = rows[rows.length-1];//getting result from a multi query setting
        cb(err, rows);
      }
    });
  },
  'selectCommission' : (date, cb) =>{
    query = 'select * from ss_client_db_type where db_type_date=' + conn.escape(date) + ' order by db_type_name;'
          + 'select * from ss_client_account where acc_date=' + conn.escape(date) + ' order by acc_name;'

    conn.query(query, (err, rows, fields) =>{
      if(err){
        console.log(err);
        cb(errs.internalServerError, rows);
      }
      else{
        let result = {
          'dbType' : rows[0],
          'account' : rows[1]
        };
        cb(err, result);
      }
    });
  },
  'escape' : (value) =>{
    return conn.escape(value);
  },
  'admin' : {
    'editProps' : (query, cb) =>{
      conn.query(query, (err, rows, fields) =>{
        if(err){
          console.log(err);
          cb(errs.internalServerError, rows);
        }
        else cb(err, [200]);
      });
    },
    'editCommssion' : (query, cb) =>{
      conn.query(query, (err, rows, fields) =>{
        if(err){
          console.log(err);
          cb(errs.internalServerError, rows);
        }
        else cb(err, [200]);
      });
    },
    'queryGenerateEditCommission' : (data)=>{
      return queryGenerateEditCommission(data);
    },
    'downloadLog' : (id, cb)=>{
      let header = `생성일자, 소속, 구분, 회원번호, CMS회사, 결과, 계약상태, 해지일, 해지사유, 사업자등록번호, 등록일, 업체명, 대표명, 담당, 동행, 지회담당, 전화번호, 핸드폰번호, 주소, 지회, DB 종료, 메모, 계약일, 계약금, 세팅일, 세팅금, 관리계약일, 관리금, 이체일, 4대보험일, 취업규칙 교육일, 취업규칙 수수료,`
                    + `성희롱 예방교육일, 성희롱 예방교육 수수료, 개인정보보호 교육일, 개인정보보호 교육 수수료, 장애인 인식 개선 교육일, 장애인 인식 개선 교육 수수료, 산업안전 교육일, 산업안전 교육 수수료, 퇴직연금 교육일, 퇴직연금 교육 수수료,  사건수임일, 사건수임 수수료 \n`;

      let query = `select created_at, ci_client,`
                + `concat(`
                + `replace(coalesce(date_format(created_at, "%Y-%m-%d"), ""), ",", "."), "," , replace(coalesce(ci_company, ""), ",", "."), "," , replace(coalesce(ci_classification, ""), ",", "."), "," , replace(coalesce(ci_cms_no,""), ",", "."), "," , replace(coalesce(ci_cms_type,""), ",", "."), "," , `
                + `replace(coalesce(ci_result,""), ",", "."), "," , replace(coalesce(ci_status,""), ",", "."), "," , replace(coalesce(ci_terminate_date,""), ",", "."), "," , replace(coalesce(ci_terminate_memo,""), ",", "."), "," , replace(coalesce(ci_ent_no,""), ",", "."), "," , `
                + `replace(coalesce(ci_sign_date,""), ",", "."), "," , replace(coalesce(ci_client,""), ",", "."), "," , replace(coalesce(ci_representive,""), ",", "."), "," ,replace(coalesce(ci_manager,""), ",", "."), "," , replace(coalesce(ci_pre_manager,""), ",", "."), "," , `
                + `replace(coalesce(ci_companion,""), ",", "."), "," , replace(coalesce(ci_local_manager,""), ",", "."), "," , replace(coalesce(ci_tel,""), ",", "."), "," , replace(coalesce(ci_mobile,""), ",", "."), "," , replace(coalesce(ci_address,""), ",", "."), "," , `
                + `replace(coalesce(ci_local_name,""), ",", "."), "," , replace(coalesce(ci_db_type,""), ",", "."), "," , replace(coalesce(ci_memo,""), ",", "."), ","   , replace(coalesce(ci_contract_date,""), ",", "."), "," , replace(coalesce(ci_contract,""), ",", "."), "," , `
                + `replace(coalesce(ci_setting_date,""), ",", "."), "," , replace(coalesce(ci_setting,""), ",", "."), "," , replace(coalesce(ci_manage_date,""), ",", "."), "," , replace(coalesce(ci_manage_fee,""), ",", "."), "," , replace(coalesce(ci_transfer_date,""), ",", "."), "," , `
                + `replace(coalesce(ci_insurance_date,""), ",", "."), "," , replace(coalesce(ci_emp_rule_date,""), ",", "."), "," , replace(coalesce(ci_emp_rule,""), ",", "."), "," , replace(coalesce(ci_harassment_date,""), ",", "."), "," , replace(coalesce(ci_harassment,""), ",", "."), "," , `
                + `replace(coalesce(ci_info_date,""), ",", "."), "," , replace(coalesce(ci_info,""), ",", "."), "," , replace(coalesce(ci_disabled_date,""), ",", "."), "," , replace(coalesce(ci_disabled,""), ",", "."), "," , replace(coalesce(ci_retirement,""), ",", "."), ",", `
                + `replace(coalesce(ci_safety_date,""), ",", "."), "," , replace(coalesce(ci_safety,""), ",", "."), "," , replace(coalesce(ci_retirement_date,""), ",", "."), "," , replace(coalesce(ci_attorney_date,""), ",", "."), "," , replace(coalesce(ci_attorney,""), ",", "."), "\n"`
                + `)as line from ss_client_info where ref_no = ${log.escape(id)} order by created_at`;

      log.query(query, (err, rows, fields) =>{
        if(err){
          console.log(err);
          cb(errs.internalServerError, rows);
        }
        else{
          if(rows.length < 1) cb(errs.noData, []);
          else {
            let data = '';
            for(i in rows) data += rows[i].line;
            let today = new Date();
            let dd = today.getDate();
            let mm = today.getMonth()+1; //January is 0!
            let yyyy = today.getFullYear();

            let buffer = Buffer.from(header + data);
            let uploadRequest = {
              'key' : fileServer.util.encode(`${rows[0].ci_client}_이력보기(${yyyy}_${mm}_${dd}).csv`),
              'dir' : 'log/',
              'mimetype' : 'text/csv',
              'buffer' : inmemory.encode(buffer)
            };

            fileServer.upload(uploadRequest, (err, result) =>{
              if(err){
                console.log(err);
                cb(errs.internalServerError, null);
              }
              else cb(null, result);
            });

          }
        }
      });
    }
  }
}

let queryGenerateSelect = (data) =>{//업체 정보 조회에 대한 쿼리문을 데이터의 형태에 맞게 수정합니다.
  let where = false;
  let prefix = 'select * from ss_client_info';
  if(!Object.keys(data).length) return prefix;
  let level = parseInt(data.user.mb_level);

  let postfix = ' where ';
  // 레벨과 소속에 의한 배타성 추가 cluase
  if(level > 2){//전체 엑세스는 2 레벨 이하의 회원만 이용할 수 있습니다.
    switch(level){
      case 3://3 레벨의 회원은 업체에 대해 본.지사별 조회가 가능합니다.
      where = true;
      postfix += 'ci_company="' + data.user.mb_company + '" and ';
      break;
      case 4://4 레벨의 회원은 본인 담당건만 조회가 가능합니다.
      where = true;
      postfix += 'ci_manager_no="' + data.user.mb_no + '" and ';
      break;
      default: // 4레벨 미만 회원은 업체 데이터베이스를 이용할 수 없습니다.
      break;
    }
  }
  else{
    if(data.ci_company){
      postfix += 'ci_company=' + conn.escape(data.ci_company) + ' and ';
      where = true;
    }
  }
  // general search filtering clause
  if(data.ci_classification){
    postfix += 'ci_classification=' + conn.escape(data.ci_classification) + ' and ';
    where = true;
  }
  if(data.ci_status){
    postfix += 'ci_status=' + conn.escape(data.ci_status) + ' and ';
    where = true;
  }
  if(data.ci_result){
    postfix += 'ci_result like ' + conn.escape('%' + data.ci_result + '%') + ' and ';
    where = true;
  }
  if(data.ci_db_type){
    postfix += 'ci_db_type=' + conn.escape(data.ci_db_type) + ' and ';
    where = true;
  }
  if(data.ci_local_name){
    postfix += 'ci_local_name like ' + conn.escape('%' + data.ci_local_name + '%') + ' and ';
    where = true;
  }
  if(data.ci_client){
    postfix += 'ci_client like ' + conn.escape('%' + data.ci_client + '%') + ' and ';
    where = true;
  }
  if(data.ci_representive){
    postfix += 'ci_representive like ' + conn.escape('%' + data.ci_representive + '%') + ' and ';
    where = true;
  }
  if(data.ci_address){
    postfix += 'ci_address like ' + conn.escape('%' + data.ci_address + '%') + ' and ';
    where = true;
  }
  if(data.ci_ent_no){
    postfix += 'ci_ent_no like' + conn.escape('%' + data.ci_ent_no + '%') + ' and ';
    where = true;
  }
  if(data.ci_mobile){
    postfix += 'ci_mobile like ' + conn.escape('%' + data.ci_mobile + '%') + ' and ';
    where = true
  }
  if(data.ci_manager){
    postfix += 'ci_manager like ' + conn.escape('%' + data.ci_manager + '%') + ' and ';
    where = true;
  }
  // date filtering clause
  if(data.ci_setting_date){
    let first_day = data.ci_setting_date + '-01';
    postfix += 'DATE(ci_setting_date)' + ' between ' + conn.escape(first_day) + ' and last_day(' + conn.escape(first_day) + ') and ';
    where = true;
  }
  if(data.ci_manage_date){
    let first_day = data.ci_manage_date + '-01';
    postfix += 'DATE(ci_manage_date)' + ' between ' + conn.escape(first_day) + ' and last_day(' + conn.escape(first_day) + ') and ';
    where = true;
  }
  // boolean type filtering clause
  if(data.retirement == 1){
    postfix += '(ci_retirement is not null or ci_retirement_date is not null) and ';
    where = true;
  }
  if(data.attorney == 1){
    postfix += '(ci_attorney is not null or ci_attorney_date is not null) and ';
    where = true;
  }
  if(data.insurance == 1){
    postfix += 'ci_insurance_date is not null and ';
    where = true;
  }
  if(data.emp_rule == 1){
    postfix += '(ci_emp_rule is not null or ci_emp_rule_date is not null) and ';
    where = true;
  }
  if(data.harassment == 1){
    postfix += '(ci_harassment is not null or ci_harassment_date is not null) and ';
    where = true;
  }
  if(data.safety == 1){
    postfix += '(ci_safety is not null or ci_safety_date is not null) and ';
    where = true;
  }
  if(data.disabled == 1){
    postfix += '(ci_disabled is not null or ci_disabled_date is not null) and ';
    where = true;
  }
  if(data.info == 1){
    postfix += '(ci_info is not null or ci_info_date is not null) and ';
    where = true;
  }

  postfix = postfix.slice(0, postfix.length-5);//remove last " and " statement
  if(where) return prefix + postfix;
  else return prefix;
}

let queryGenerateInsert = (tableName, data) =>{//업체 정보 삽입에 대한 쿼리문을 데이터의 형태에 맞게 수정합니다.
  let prefix = 'insert into ' + tableName;
  let field = 'created_at,ci_editor_no';
  let value = 'now(),' + conn.escape(data.user.mb_no);
  let dupOpt = ' on duplicate key update ';
  if(!Object.keys(data).length) return null;
  if(data.ci_no){
    field += ',ci_no';
    value += ',' + conn.escape(data.ci_no);
    dupOpt += 'ci_no=values(ci_no), ';
  }
  if(data.ci_company){
    field += ',ci_company';
    value += ',' + conn.escape(data.ci_company);
    dupOpt += 'ci_company=values(ci_company), ';
  }
  if(data.ci_classification){
    field += ',ci_classification';
    value += ',' + conn.escape(data.ci_classification);
    dupOpt += 'ci_classification=values(ci_classification), ';
  }
  if(data.ci_cms_no){
    field += ',ci_cms_no';
    value += ',' + conn.escape(data.ci_cms_no);
    dupOpt += 'ci_cms_no=values(ci_cms_no), ';
  }
  if(data.ci_cms_type){
    field += ',ci_cms_type';
    value += ',' + conn.escape(data.ci_cms_type);
    dupOpt += 'ci_cms_type=values(ci_cms_type), ';
  }
  if(data.ci_terminate_date){
    field += ',ci_terminate_date';
    value += ',' + conn.escape(data.ci_terminate_date);
    dupOpt += 'ci_terminate_date=values(ci_terminate_date), ';
  }
  if(data.ci_terminate_memo){
    field += ',ci_terminate_memo';
    value += ',' + conn.escape(data.ci_terminate_memo);
    dupOpt += 'ci_terminate_memo=values(ci_terminate_memo), ';
  }
  if(data.ci_ent_no){
    field += ',ci_ent_no';
    value += ',' + conn.escape(data.ci_ent_no);
    dupOpt += 'ci_ent_no=values(ci_ent_no), ';
  }
  if(data.ci_sign_date){
    field += ',ci_sign_date';
    value += ',' + conn.escape(data.ci_sign_date);
    dupOpt += 'ci_sign_date=values(ci_sign_date), ';
  }
  if(data.ci_client){
    field += ',ci_client';
    value += ',' + conn.escape(data.ci_client);
    dupOpt += 'ci_client=values(ci_client), ';
  }
  if(data.ci_representive){
    field += ',ci_representive';
    value += ',' + conn.escape(data.ci_representive);
    dupOpt += 'ci_representive=values(ci_representive), ';
  }
  if(data.ci_manager_no){
    field += ',ci_manager_no';
    value += ',' + conn.escape(data.ci_manager_no);
    dupOpt += 'ci_manager_no=values(ci_manager_no), ';
  }
  if(data.ci_manager){
    field += ',ci_manager';
    value += ',' + conn.escape(data.ci_manager);
    dupOpt += 'ci_manager=values(ci_manager), ';
  }
  if(data.ci_pre_manager_no){
    field += ',ci_pre_manager_no';
    value += ',' + conn.escape(data.ci_pre_manager_no);
    dupOpt += 'ci_pre_manager_no=values(ci_pre_manager_no), ';
  }
  if(data.ci_pre_manager){
    field += ',ci_pre_manager';
    value += ',' + conn.escape(data.ci_pre_manager);
    dupOpt += 'ci_pre_manager=values(ci_pre_manager), ';
  }
  if(data.ci_companion_no){
    field += ',ci_companion_no';
    value += ',' + conn.escape(data.ci_companion_no);
    dupOpt += 'ci_companion_no=values(ci_companion_no), ';
  }
  if(data.ci_companion){
    field += ',ci_companion';
    value += ',' + conn.escape(data.ci_companion);
    dupOpt += 'ci_companion=values(ci_companion), ';
  }
  if(data.ci_local_manger_no){
    field += ',ci_local_manger_no';
    value += ',' + conn.escape(data.ci_local_manger_no);
    dupOpt += 'ci_local_manager_no=values(ci_local_manger_no), ';
  }
  if(data.ci_local_manger){
    field += ',ci_local_manger';
    value += ',' + conn.escape(data.ci_local_manger);
    dupOpt += 'ci_local_manager=values(ci_local_manger), ';
  }
  if(data.ci_tel){
    field += ',ci_tel';
    value += ',' + conn.escape(data.ci_tel);
    dupOpt += 'ci_tel=values(ci_tel), ';
  }
  if(data.ci_mobile){
    field += ',ci_mobile';
    value += ',' + conn.escape(data.ci_mobile);
    dupOpt += 'ci_mobile=values(ci_mobile), ';
  }
  if(data.ci_address){
    field += ',ci_address';
    value += ',' + conn.escape(data.ci_address);
    dupOpt += 'ci_address=values(ci_address), ';
  }
  if(data.ci_local_name){
    field += ',ci_local_name';
    value += ',' + conn.escape(data.ci_local_name);
    dupOpt += 'ci_local_name=values(ci_local_name), ';
  }
  if(data.ci_db_type){
    field += ',ci_db_type';
    value += ',' + conn.escape(data.ci_db_type);
    dupOpt += 'ci_db_type=values(ci_db_type), ';
  }
  if(data.ci_memo){
    field += ',ci_memo';
    value += ',' + conn.escape(data.ci_memo);
    dupOpt += 'ci_memo=values(ci_memo), ';
  }
  if(data.ci_contract_date){
    field += ',ci_contract_date';
    value += ',' + conn.escape(data.ci_contract_date);
    dupOpt += 'ci_contract_date=values(ci_contract_date), ';
  }
  if(data.ci_contract){
    field += ',ci_contract';
    value += ',' + conn.escape(data.ci_contract);
    dupOpt += 'ci_contract=values(ci_contract), ';
  }
  if(data.ci_setting_date){
    field += ',ci_setting_date';
    value += ',' + conn.escape(data.ci_setting_date);
    dupOpt += 'ci_setting_date=values(ci_setting_date), ';
  }
  if(data.ci_setting){
    field += ',ci_setting';
    value += ',' + conn.escape(data.ci_setting);
    dupOpt += 'ci_setting=values(ci_setting), ';
  }
  if(data.ci_manage_date){
    field += ',ci_manage_date';
    value += ',' + conn.escape(data.ci_manage_date);
    dupOpt += 'ci_manage_date=values(ci_manage_date), ';
  }
  if(data.ci_manage_fee){
    field += ',ci_manage_fee';
    value += ',' + conn.escape(data.ci_manage_fee);
    dupOpt += 'ci_manage_fee=values(ci_manage_fee), ';
  }
  if(data.ci_transfer_date){
    field += ',ci_transfer_date';
    value += ',' + conn.escape(data.ci_transfer_date);
    dupOpt += 'ci_transfer_date=values(ci_transfer_date), ';
  }
  if(data.ci_insurance_date){
    field += ',ci_insurance_date';
    value += ',' + conn.escape(data.ci_insurance_date);
    dupOpt += 'ci_insurance_date=values(ci_insurance_date), ';
  }
  if(data.ci_emp_rule_date){
    field += ',ci_emp_rule_date';
    value += ',' + conn.escape(data.ci_emp_rule_date);
    dupOpt += 'ci_emp_rule_date=values(ci_emp_rule_date), ';
  }
  if(data.ci_emp_rule){
    field += ',ci_emp_rule';
    value += ',' + conn.escape(data.ci_emp_rule);
    dupOpt += 'ci_emp_rule=values(ci_emp_rule), ';
  }
  if(data.ci_harassment_date){
    field += ',ci_harassment_date';
    value += ',' + conn.escape(data.ci_harassment_date);
    dupOpt += 'ci_harassment_date=values(ci_harassment_date), ';
  }
  if(data.ci_harassment){
    field += ',ci_harassment';
    value += ',' + conn.escape(data.ci_harassment);
    dupOpt += 'ci_harassment=values(ci_harassment), ';
  }
  if(data.ci_info_date){
    field += ',ci_info_date';
    value += ',' + conn.escape(data.ci_info_date);
    dupOpt += 'ci_info_date=values(ci_info_date), ';
  }
  if(data.ci_info){
    field += ',ci_info';
    value += ',' + conn.escape(data.ci_info);
    dupOpt += 'ci_info=values(ci_info), ';
  }
  if(data.ci_disabled_date){
    field += ',ci_disabled_date';
    value += ',' + conn.escape(data.ci_disabled_date);
    dupOpt += 'ci_disabled_date=values(ci_disabled_date), ';
  }
  if(data.ci_disabled){
    field += ',ci_disabled';
    value += ',' + conn.escape(data.ci_disabled);
    dupOpt += 'ci_disabled=values(ci_disabled), ';
  }
  if(data.ci_safety_date){
    field += ',ci_safety_date';
    value += ',' + conn.escape(data.ci_safety_date);
    dupOpt += 'ci_safety_date=values(ci_safety_date), ';
  }
  if(data.ci_safety){
    field += ',ci_safety';
    value += ',' + conn.escape(data.ci_safety);
    dupOpt += 'ci_safety=values(ci_safety), ';
  }
  if(data.ci_retirement_date){
    field += ',ci_retirement_date';
    value += ',' + conn.escape(data.ci_retirement_date);
    dupOpt += 'ci_retirement_date=values(ci_retirement_date), ';
  }
  if(data.ci_retirement){
    field += ',ci_retirement';
    value += ',' + conn.escape(data.ci_retirement);
    dupOpt += 'ci_retirement=values(ci_retirement), ';
  }
  if(data.ci_attorney_date){
    field += ',ci_attorney_date';
    value += ',' + conn.escape(data.ci_attorney_date);
    dupOpt += 'ci_attorney_date=values(ci_attorney_date), ';
  }
  if(data.ci_attorney){
    field += ',ci_attorney';
    value += ',' + conn.escape(data.ci_attorney);
    dupOpt += 'ci_attorney=values(ci_attorney), ';
  }
  if(data.ci_attachment){
    field += ',ci_attachment';
    value += ',' + conn.escape(data.ci_attachment);
    dupOpt += 'ci_attachment=values(ci_attachment), ';
  }

  let postfix = '('+field+') values('+value+')' + dupOpt.slice(0, dupOpt.length-2);//remove ", " at last dup Opt
  return prefix + postfix;

}

let queryGenerateEditCommission = (data) =>{
  let dataArray = data;
  let result = {};
  let values = [];
  let dupOpt = ' on duplicate key update ';

  for(i in dataArray) values.push('(');
  data = data[0];

  if(data.db_type_no){
    for(i in dataArray) values[i] += conn.escape(dataArray[i].db_type_no) + ', ';
    dupOpt += 'db_type_no=values(db_type_no), ';
  }
  if(data.db_type_name){
    for(i in dataArray) values[i] += conn.escape(dataArray[i].db_type_name) + ', ';
    dupOpt += 'db_type_name=values(db_type_name), ';
  }
  if(data.db_type_date){
    for(i in dataArray) values[i] += conn.escape(dataArray[i].db_type_date) + ', ';
    dupOpt += 'db_type_date=values(db_type_date), ';
  }
  if(data.db_type_share){
    for(i in dataArray) values[i] += conn.escape(dataArray[i].db_type_share) + ', ';
    dupOpt += 'db_type_share=values(db_type_share), ';
  }
  if(data.db_type_central_share){
    for(i in dataArray) values[i] += conn.escape(dataArray[i].db_type_central_share) + ', ';
    dupOpt += 'db_type_central_share=values(db_type_central_share), ';
  }
  if(data.db_type_POS_share){
    for(i in dataArray) values[i] += conn.escape(dataArray[i].db_type_POS_share) + ', ';
    dupOpt += 'db_type_POS_share=values(db_type_POS_share), ';
  }
  if(data.db_type_program_share){
    for(i in dataArray) values[i] += conn.escape(dataArray[i].db_type_program_share) + ', ';
    dupOpt += 'db_type_program_share=values(db_type_program_share), ';
  }
  if(data.db_type_head_officer_share){
    for(i in dataArray) values[i] += conn.escape(dataArray[i].db_type_head_officer_share) + ', ';
    dupOpt += 'db_type_head_officer_share=values(db_type_head_officer_share), ';
  }
  if(data.db_type_company_share){
    for(i in dataArray) values[i] += conn.escape(dataArray[i].db_type_company_share) + ', ';
    dupOpt += 'db_type_company_share=values(db_type_company_share), ';
  }
  if(data.db_type_manager_share){
    for(i in dataArray) values[i] += conn.escape(dataArray[i].db_type_manager_share) + ', ';
    dupOpt += 'db_type_manager_share=values(db_type_manager_share), ';
  }

  if(data.acc_no){
    for(i in dataArray) values[i] += conn.escape(dataArray[i].acc_no) + ', ';
    dupOpt += 'acc_no=values(acc_no), ';
  }
  if(data.acc_name){
    for(i in dataArray) values[i] += conn.escape(dataArray[i].acc_name) + ', ';
    dupOpt += 'acc_name=values(acc_name), ';
  }
  if(data.acc_date){
    for(i in dataArray) values[i] += conn.escape(dataArray[i].acc_date) + ', ';
    dupOpt += 'acc_date=values(acc_date), ';
  }
  if(data.acc_share){
    for(i in dataArray) values[i] += conn.escape(dataArray[i].acc_share) + ', ';
    dupOpt += 'acc_share=values(acc_share), ';
  }
  if(data.acc_company_share){
    for(i in dataArray) values[i] += conn.escape(dataArray[i].acc_company_share) + ', ';
    dupOpt += 'acc_company_share=values(acc_company_share), ';
  }
  if(data.acc_manager_share){
    for(i in dataArray) values[i] += conn.escape(dataArray[i].acc_manager_share) + ', ';
    dupOpt += 'acc_manager_share=values(acc_manager_share), ';
  }

  for(i in values) values[i] = values[i].substr(0, values[i].length-2) + '),';
  values[values.length-1] = values[values.length-1].substr(0, values[i].length-1);//마지막 ,를 제거 합니다.
  result.values = values;
  result.dupOpt = dupOpt.substr(0, dupOpt.length-2);

  return result;
}
