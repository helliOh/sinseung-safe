var bkfd2Password = require("pbkdf2-password");
var hasher = bkfd2Password();

let pass = process.argv[2];
let opts = {
  'pass' : pass
};
console.log(pass);
hasher(opts, function(err, pass, salt, hash) {
  console.log("PASS : ");
  console.log("\x1b[36m", pass);
  console.log("\x1b[0m");
  console.log("SALT : ");
  console.log("\x1b[36m", salt);
  console.log("\x1b[0m");
  console.log("HASH : ");
  console.log("\x1b[36m", hash);
  console.log("\x1b[0m");
});
// 회원가입 + 로그인 passport 추가
//URL 구조 문서화
