const stream = require('stream');
const exceljs = require('exceljs');
const inmemory = require('./inMemory');

let metaDataHyoSung = [
    {'db':'id', 'excel' : 'ID'},
    {'db':'created_at', 'excel' : '생성일자'},
    {'db':'ci_company', 'excel' : '소속'},
    {'db':'ci_classification', 'excel' : '구분'},
    {'db':'ci_cms_no', 'excel' : '회원번호'},
    {'db':'ci_cms_type', 'excel' : 'CMS종류'},
    {'db':'ci_result', 'excel' : '결과'},
    {'db':'ci_status', 'excel' : '계약상태'},
    {'db':'ci_terminate_date', 'excel' : '해지일'},
    {'db':'ci_terminate_memo', 'excel' : '해지사유'},
    {'db':'ci_ent_no', 'excel' : '사업자등록번호'},
    {'db':'ci_sign_date', 'excel' : '계약일'},
    {'db':'ci_client', 'excel' : '업체명'},
    {'db':'ci_representive', 'excel' : '대표명'},
    {'db':'ci_manager', 'excel' : '담당'},
    {'db':'ci_pre_manager', 'excel' : '전담당'},
    {'db':'ci_companion', 'excel' : '동행'},
    {'db':'ci_local_manager', 'excel' : '지회담당자'},
    {'db':'ci_tel', 'excel' : '전화번호'},
    {'db':'ci_mobile', 'excel' : '핸드폰번호'},
    {'db':'ci_address', 'excel' : '주소'},
    {'db':'ci_local_name', 'excel' : '지회'},
    {'db':'ci_db_type', 'excel' : 'DB종류'},
    {'db':'ci_memo', 'excel' : '메모'},
    {'db':'ci_contract_date', 'excel' : '계약일'},
    {'db':'ci_contract', 'excel' : '계약금'},
    {'db':'ci_setting_date', 'excel' : '세팅일'},
    {'db':'ci_setting', 'excel' : '세팅금'},
    {'db':'ci_manage_date', 'excel' : '관리일'},
    {'db':'ci_manage_fee', 'excel' : '관리금'},
    {'db':'ci_transfer_date', 'excel' : '이체일'},
    {'db':'ci_insurance_date', 'excel' : '4대보험일'},
    {'db':'ci_emp_rule_date', 'excel' : '취업교육일'},
    {'db':'ci_emp_rule', 'excel' : '취업교육금'},
    {'db':'ci_harassment_date', 'excel' : '성희롱예방교육일'},
    {'db':'ci_harassment', 'excel' : '성희롱예방교육금'},
    {'db':'ci_info_date', 'excel' : '개인정보보호교육일'},
    {'db':'ci_info', 'excel' : '개인정보보호교육금'},
    {'db':'ci_disabled_date', 'excel' : '장애인인식개선교육일'},
    {'db':'ci_disabled', 'excel' : '장애인인식개선교육금'},
    {'db':'ci_safety_date', 'excel' : '산업안전교육일'},
    {'db':'ci_safety', 'excel' : '산업안전교육금'},
    {'db':'ci_retirement_date', 'excel' : '퇴직관련교육일'},
    {'db':'ci_retirement', 'excel' : '퇴직관련교육금'},
    {'db':'ci_attorney_date', 'excel' : '사건수임교육일'},
    {'db':'ci_attorney', 'excel' : '사건수임교육금'}];

module.exports = {
    'parseCSV' : (readStream, destStream, buffer, cb) =>{
        let finalError = null;

        destStream
            .on('data', (chunk) =>{console.log();})
            .on('error', (err) =>{ console.log(err); })
            .on('end', () =>{});

        let workbook = new exceljs.Workbook();

        let self = {
            'columnCount' : 0,
            'rowCount' : 0,
            'encoding' : 'EUC-KR',
            'header' : {},
            'rows' : []
        };
        delete sheet;
        let excelStream = workbook.csv.createInputStream()
            .on('worksheet', (worksheet) =>{
                self.dateData = new Set();

                self.rowCount = worksheet.rowCount;
                self.columnCount = worksheet.columnCount;

                worksheet.eachRow((row, rowNo) =>{
                    let rowData = {};
                    if(rowNo < 2) setHeader(row.values, self.header)//callByReference
                    else{
                        row.eachCell((cell, cellNo) =>{
                            let idx = self.header[cellNo.toString()];
                            if(idx == '결제일'){
                                if(cell.value instanceof Date) cell.value = cell.value.toISOString().slice(0,10);
                                cell.value = cell.value.toString().replace(/\//gi, '-');
                                self.dateData.add(cell.value);
                            }
                            if(idx == '신청금액' || idx == '결제금액'){
                              cell.value = cell.value.toString().replace(/\,/gi, '');
                              cell.value = cell.value.toString().replace(/\./gi, '');
                              cell.value = cell.value.toString().replace(/원/gi, '');
                            }
                            if(idx == '회원번호') cell.value = zeroPad(cell.value.toString(), 8);
                            cell.value = cell.value.toString().replace(/,/gi, '');
                            if(!cell.value) cell.value='null';
                            rowData[idx] = cell.value;
                        });
                        self.rows.push(rowData);
                    }
                });
            })
            .on('end', ()=>{
                cb(finalError, self);
            });

        destStream.pipe(excelStream);
        readStream.write(buffer);
        readStream.end();
    },
    'createStreamFromDB' : (data, cb) =>{//cb(data, streamIterface)
        let workbook = new exceljs.Workbook();
        workbook.creator = '신승CNS';
        workbook.lastModifiedBy = '신승CNS';
        workbook.created = new Date();
        workbook.modified = new Date();

        let worksheet = workbook.addWorksheet('업체DB');

        let headerAsExcel = [];
        for (idx in metaDataHyoSung) headerAsExcel.push(metaDataHyoSung[idx].excel);
        worksheet.addRow(headerAsExcel).commit();

        for(i in data){
            let d = data[i];
            let r = [];
            //mapping the db and excel object
            for (idx in metaDataHyoSung){
                if(metaDataHyoSung[idx].db == 'id') r.push(i+1);
                else{
                    if(d[metaDataHyoSung[idx].db] == null) r.push('');
                    else r.push(d[metaDataHyoSung[idx].db]);
                }
            }
            worksheet.addRow(r).commit();
        }
        cb(workbook);
    },
    'xlsx2Csv' : (buffer, cb) =>{
        let finalError = null;
        let csvBuffer = [];
        let destStream = new stream.PassThrough()
            .on('data', chunk => {
                csvBuffer.push(chunk);
                console.log(chunk.length);
            })
            .on('error', error => finalError = error)
            .on('end', () =>{
                csvBuffer = Buffer.concat(csvBuffer);
                cb(finalError,csvBuffer);
            });
        // console.log('in workbook context');
        let workbook = new exceljs.Workbook();

        let excelStream = workbook.csv.createInputStream()
            .on('done', () =>{
                // console.log('아 시발 데이터는 어딨어');
                cb(finalError,csvBuffer);
            })
            .on('error', (error) =>{
                finalError = error;
                console.log(error);
                cb(finalError,csvBuffer);
            });

        excelStream.write(buffer);
        excelStream.end();

    },
    // 'writeCSV' : () =>{
    //
    // },
    // 'csv2xlsx' :() =>{
    //
    // }
}

let setHeader = (rowObj, header) =>{
    for(i in rowObj){
        let colName = rowObj[i];
        header[i] = colName;
    }
    if(!header['1']) header['1'] = 'ID';
}

let zeroPad = (str, width) =>{
    let padded = str;
    while(padded.length < width) padded = '0' + padded;
    return padded;
}
