module.exports = {//Post custom error for security
  "passwordFail" : {
    "code" : 1,
    "message" : "요청한 패스워드가 맞지 않습니다."
  },
  "cannotDeleteKey": {
    "code" : 66,
    "message" : "해당 키를 삭제할 수 없습니다."
  },
  "cannotUpdateKey": {
    "code" : 99,
    "message" : "이미 존재하는 키에 대해 수행할수 없는 연산입니다."
  },
  'improperRequest' : {
    "code" : 8,
    "message" : "적합하지 않은 요청입니다."
  },
  'unauthorizedUser' : {
    "code" : 9,
    "message" : "해당 요청에 대한 권한이 없습니다."
  },
  "unauthorizedRequest" : {
    "code" : 10,
    "message" : "인증되지 않은 요청입니다."
  },
  "internalServerError" : {
    "code" : 400,
    "message" : "서버 내부 에러입니다."
  },
  "invalidKey" : {
    "code" : 398,
    "message" : "파일 서버에서 해당 Key의 file이 존재하지 않거나 찾을 수 없습니다."
  },
  "invaildFileFormat" : {
    "code" : 412,
    "message" : "해당 파일 업로드의 format이 적합하지 않습니다. (2018.9 기준) .csv 형식만을 지원합니다."
  },
  'noData' : {
    "code" : 481,
    "message" : "요청에 대한 데이터가 존재하지 않습니다."
  },
  "util" : {
    "highlight" : (cb) =>{
      highlight(cb);
    },
    "cyan" : (value) =>{
      console.log("\x1b[36m", value, "\x1b[0m");
    }
  }

}

var convertJsDateToDate = (dateObj) =>{
  if(!dateObj) return null;
  let date = dateObj.getFullYear();
  console.log(date);
  if(dateObj.getMonth().toString().length < 2) date += '-0' + dateObj.getMonth();
  else date += '-' + dateObj.getMonth();
  console.log(date);
  if(dateObj.getDay().toString().length < 2) date += '-0' + dateObj.getDay();
  else date += '-' + dateObj.getDay();
  console.log(date);
  return date;
}

var parseJsDateToDate = (dateStr) =>{
  if(!dateStr) return null;
  if(dateStr == '') return null;
  return dateStr.split("T")[0];
}

var highlight = (cb) =>{
  console.log("--------------------------------------------------------------------------------------------------");
  cb();
  console.log("--------------------------------------------------------------------------------------------------");
}
