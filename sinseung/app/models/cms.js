const fileServer = require('./fileServer');
const inmemory = require('../../lib/inMemory');
const excelParser = require('../../lib/excelParser');
const DB = require('../../config/database');
const errs = require('../../config/errors');

const mysql = require('mysql');

const member = mysql.createConnection(DB.member);
const client = mysql.createConnection(DB.client);
const conn = mysql.createConnection(DB.cms);


module.exports = {
  'upload' : (buffer, cb) =>{
    inmemory.decodePipeLine((readStream, destStream) =>{

      excelParser.parseCSV(readStream, destStream, buffer, (err, data) =>{
        let mappedData = mapper(data.rows);

        mappedData = mappedData.slice(1, mappedData.length+1);//remove the header

        let dateData = [...data.dateData];//[...set] => set to array
        delete data.rows;
        delete data;

        let maxDate = dateData[0];
        let minDate = dateData[dateData.length-1];

        let insertStatement = `insert into ss_cms_buffer(cms_date, cms_no, cms_client, cms_account_no, cms_req_amount, cms_res_amount, cms_status)`;
        let postfix = `on duplicate key update cms_date=values(cms_date), cms_no=values(cms_no), cms_client=values(cms_client), cms_account_no=values(cms_account_no), cms_req_amount=values(cms_req_amount), cms_res_amount=values(cms_res_amount), cms_status=values(cms_status)`;
        let values = ' values \n';

        for(i in mappedData){
          let b = bracketfy(mappedData[i]);
          // if (i<6) console.log(b);
          if(b.indexOf('undefined') != -1) continue;
          else values += b;
        }

        values = values.substr(0, values.length-2);

        insertStatement += values;

        let query = insertStatement + postfix;

        //let's go
        conn.query(query, (err, rows, fields) =>{
          if(err){
            // console.log(err);
            cb(errs.internalServerError, []);
          }
          else cb(err, rows);

        });
      });
    });
  },
  'downloadPayment' : (data, cb) =>{//업체 정보를 삽입합니다.
    let today = new Date();
    let dd = today.getDate();
    let mm = today.getMonth()+1; //January is 0!
    let yyyy = today.getFullYear();

    let buffer = Buffer.from(data.csv);
    let uploadRequest = {
      'key' : fileServer.util.encode(`${data.year != ''? data.year : '전체'}년${data.month? (data.month != ''? data.month : '전체') + '월': ''}-${data.company != ''? data.company : '전체'}-${data.username}_${data.table}연체조회(${yyyy}_${mm}_${dd}).csv`),
      'dir' : 'cms/',
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
  'downloadCommission' : (data, cb) =>{//업체 정보를 삽입합니다.
    let today = new Date();
    let dd = today.getDate();
    let mm = today.getMonth()+1; //January is 0!
    let yyyy = today.getFullYear();

    let buffer = Buffer.from(data.csv);
    let uploadRequest = {
      'key' : fileServer.util.encode(`${data.date.replace('-', '년') + '월'}_${data.username}_${data.table}(${yyyy}_${mm}_${dd}).csv`),
      'dir' : 'cms/',
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
  'sync' : (cb) =>{
    let createDump = 'create table if not exists dump ('
                   + 'dump_no int(11) NOT NULL AUTO_INCREMENT,'
                   + 'cms_id_no int(11) NOT NULL,'
                   + 'PRIMARY KEY (`dump_no`)'
                   + ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n';

    let insertStatement = `insert into ss_cms(cms_hash, cms_no, cms_type, cms_db_type, cms_classification, cms_representive, cms_date, cms_client, cms_account_no, cms_req_amount, cms_res_amount, cms_company, cms_status, cms_manager_no, cms_manager_name) `
                        + `(select cms_hash, cms_no, cms_type, cms_db_type, cms_classification, cms_representive, cms_date, cms_client, cms_account_no, cms_req_amount, cms_res_amount, cms_company, cms_status, cms_manager_no, cms_manager_name from ss_cms_synchronizer where cms_sync=1) `
                        + `on duplicate key update cms_no=values(cms_no), cms_type=values(cms_type), cms_db_type=values(cms_db_type), cms_classification=values(cms_classification), cms_representive=values(cms_representive), cms_date=values(cms_date), cms_client=values(cms_client), cms_account_no=values(cms_account_no), cms_req_amount=values(cms_req_amount), `
                        + `cms_res_amount=values(cms_res_amount), cms_company=values(cms_company), cms_status=values(cms_status), cms_manager_no=values(cms_manager_no), cms_manager_name=values(cms_manager_name);\n`;
    //insert verifed rows that are verified by ss_cms_synchronizer from data table
    let copyToDump = 'insert into dump(cms_id_no) select cms_id_no from ss_cms_synchronizer where cms_sync=1;\n';
    let deleteStatement = 'delete from ss_cms_buffer where cms_id_no in (select cms_id_no from dump);\n'
    //delete verifed rows that are verified by ss_cms_synchronizer from buffer table
    let dropDump = 'drop table if exists dump;';

    let query = createDump + insertStatement + copyToDump + deleteStatement + dropDump;

    conn.query(query, (err, rows, fields) =>{
      if(err){
        console.log(err);
        cb(errs.internalServerError, []);
      }
      else cb(err, rows);
    });
  },
  'selectUnsynced' : (params, cb) =>{
    let year = params.year;
    let month = params.month;

    let query = 'select cms_id_no, cms_no, cms_type, cms_db_type, cms_classification, cms_representive, cms_date, cms_client, cms_account_no, cms_req_amount, cms_res_amount, cms_company, '
              + `cms_status, cms_manager_no, cms_manager_name from ss_cms_synchronizer where cms_sync=0 and year(cms_date)=${conn.escape(year)} and month(cms_date)=${conn.escape(month)}`;

    conn.query(query, (err, rows, fields) =>{
      if(err){
        console.log(err);
        cb(errs.internalServerError, []);
      }
      else cb(err, rows);
    });
  },
  'selectUnsyncedMeta' : (cb) =>{
    conn.query(`select distinct year(cms_date) as cms_date_year, month(cms_date) as cms_date_month from ss_cms_synchronizer where cms_sync=0 order by cms_date_year DESC, cms_date_month DESC`, (err, rows, fields) =>{
      if(err){
        console.log(err);
        cb(errs.internalServerError, []);
      }
      else{
        let data = {};
        let years = new Set();
        for(i in rows) years.add(rows[i].cms_date_year);

        years = [...years];//now we have distinct years
        for(i in years) data[years[i]] = [];
        for(i in rows) data[rows[i].cms_date_year].push(rows[i].cms_date_month);
        cb(err, data);
      }
    });
  },
  'selectSynced' : (params, cb) =>{
    let query = 'select * from ss_cms' // simple query generating using es6 template literals
              + `${params.company || params.manager || params.year? ' where ' : ''}`
              + `${params.company? 'cms_company=' + conn.escape(params.company) : '' }`
              + `${params.company && (params.manager || params.year)? ' and ' : ''}`
              + `${params.manager? 'cms_manager_no=' + conn.escape(params.manager) : '' }`
              + `${params.manager && params.year? ' and ' : ''}`
              + `${params.year? 'year(cms_date)=' + conn.escape(params.year) : '' }`;

    conn.query(query, (err, rows, fields) =>{
      if(err){
        console.log(err);
        cb(errs.internalServerError, []);
      }
      else cb(err, rows);
    });
  },
  'selectUploadStatus' : (cb) =>{
    let query = `select distinct year(cms_date) as year, month(cms_date) as month from ss_cms `
              + `union `
              + `select distinct year(cms_date) as year, month(cms_date) as month from ss_cms_buffer`;

    conn.query(query, (err, rows, fields) =>{
      if(err){
        console.log(err);
        cb(errs.internalServerError, []);
      }
      else{
        let data = {};
        let years = new Set();
        for(i in rows) years.add(rows[i].year);

        years = [...years];//now we have distinct years
        for(i in years) data[years[i]] = new Set();
        for(i in rows) data[rows[i].year].add(rows[i].month);
        for(i in years) data[years[i]] = [...data[years[i]]];

        cb(err, data);
      }
    });
  },
  'selectCommission' : (params, cb) =>{
    if(params.mb_no) params.user = {'mb_no' : params.mb_no};
    let query = `call getCommission_manage(${conn.escape(params.date)}, ${conn.escape(params.user.mb_no)});\n`
              + `call getCommission_POS(${conn.escape(params.date)}, ${conn.escape(params.user.mb_no)});\n`
              + `select * from ss_income_tax_view where tax_date between date(concat(year(${conn.escape(params.date)}),'-02-01')) and date(concat(year(${conn.escape(params.date)})+1,'-02-01'));`;

    conn.query(query, (err, rows, fields) =>{
      if(err){
        console.log(err);
        cb(errs.internalServerError, []);
      }
      else{
        let cmsData = rows[0];
        // let spResponsePacket = rows[1]
        let posData = rows[2];
        // let spResponsePacket = rows[3]
        let taxData = rows[4];

        let query = `call getCommission_setting(${conn.escape(params.date)}, ${conn.escape(params.user.mb_no)});\n`
                  + `call getCommission_emp_rule(${conn.escape(params.date)}, ${conn.escape(params.user.mb_no)});\n`
                  + `call getCommission_info(${conn.escape(params.date)}, ${conn.escape(params.user.mb_no)});\n`
                  + `call getCommission_disabled(${conn.escape(params.date)}, ${conn.escape(params.user.mb_no)});\n`
                  + `call getCommission_harassment(${conn.escape(params.date)}, ${conn.escape(params.user.mb_no)});\n`
                  + `call getCommission_safety(${conn.escape(params.date)}, ${conn.escape(params.user.mb_no)});\n`
                  + `call getCommission_retirement(${conn.escape(params.date)}, ${conn.escape(params.user.mb_no)});\n`
                  + `call getCommission_attorney(${conn.escape(params.date)}, ${conn.escape(params.user.mb_no)});\n`;

        client.query(query, (err, rows, fields) =>{
          if(err){
            console.log(err);
            cb(errs.internalServerError, []);
          }
          else{
            let data = {};
            data.setting = rows[0];
            // let spResponsePacket = rows[1]
            data.emp_rule = rows[2];
            // let spResponsePacket = rows[3]
            data.info = rows[4];
            // let spResponsePacket = rows[5]
            data.disabled = rows[6];
            // let spResponsePacket = rows[7]
            data.harassment = rows[8];
            // let spResponsePacket = rows[9]
            data.safety = rows[10];
            // let spResponsePacket = rows[11]
            data.retirement = rows[12];
            // let spResponsePacket = rows[13]
            data.attorney = rows[14];
            // let spResponsePacket = rows[15]
            data.share = rows[16];

            data.manage = cmsData;
            data.POS = posData;
            data.income_tax = taxData;

            let query = `select mb_no, mb_name, mb_level, mb_company, mb_income_class, mb_position from ss_member where mb_no=${params.user.mb_no}`;
            member.query(query, (err, rows, fields) =>{
              if(err){
                console.log(err);
                cb(errs.internalServerError, []);
              }
              else{
                let memberData = rows[0];
                data.user = memberData;
                cb(err, data);
              }
            });
          }
        });
      }
    });
  },
  'middleWare' : {
    'euckr2utf' : (buffer, cb) =>{
      inmemory.decodePipeLine((readStream, destStream) =>{
        let utfBuffer = [];
        let finalError = null;

        destStream
        .on('data', chunk => utfBuffer.push(chunk))
        .on('end', () =>{
          utfBuffer = Buffer.concat(utfBuffer);
          // console.log(inmemory.detect(utfBuffer));
          cb(finalError, utfBuffer);
        })
        .on('error', err => finalError = err);
        // console.log(inmemory.detect(buffer));
        readStream.write(buffer);
        readStream.end();
      });
    },
    'xlsx2Csv' : (buffer, cb) =>{

      excelParser.xlsx2Csv(buffer, (err, data) =>{

        cb(err, data);
      })
    },
  },//middle ware ends
}

let mapper = (data) =>{
  let responseData = [];

  let keyMap = {
    '결제일': 'cms_date',
    '회원번호': 'cms_no',
    '회원명': 'cms_client',
    '결제번호': 'cms_account_no',
    '신청금액': 'cms_req_amount',
    '결제금액': 'cms_res_amount',
    '상태': 'cms_status'
  }

  for(i in data){
    let eachData = data[i];
    responseData.push({});

    for(colName in eachData){
      if(!keyMap[colName]) continue;
      let key = keyMap[colName];
      if(!eachData[colName]) eachData[colName] = null;
      responseData[i][key] = eachData[colName];
    }
  }

  return responseData;
}

let bracketfy = (data) =>{
  return `("${data.cms_date}","${data.cms_no}","${data.cms_client}","${data.cms_account_no}","${data.cms_req_amount}","${data.cms_res_amount}","${data.cms_status}"),\n`;
}

// let trySync = () =>{
//   conn.query();
// }
