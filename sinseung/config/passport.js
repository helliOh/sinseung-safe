let LocalStrategy   = require('passport-local').Strategy;
let RequestStrategy = require('passport-request').Strategy;
let member            = require('../app/models/member');

let bkfd2Password = require("pbkdf2-password");
let hasher = bkfd2Password();
let errs = require("./errors.js");

//expose this function to our app using module.exports
module.exports = (passport) =>{

    passport.serializeUser((user, done) =>{//세션 정보를 단축할 키를 정의합니다.
        done(null, user.mb_no);
    });

    passport.deserializeUser((no, done) =>{//유저 객체를 재구성 할 방법을 정의합니다.
        member.login.findUserById(no, (user) =>{
            //사이에 랜덤 해쉬값 넣기
            user.token = Buffer.from(`${user.mb_no}:${user.mb_id}:${user.mb_name}:${user.mb_level}:${user.mb_company}`).toString('base64');
            //user.token : POST 인증에 사용되는 토큰
            if(user) done(null, user);
        });
    });

    passport.use('local@login', new LocalStrategy({//로그인에 대한 passport 로컬 전략
        usernameField : 'id',//브라우저에서 전송한 name value입니다.
        passwordField : 'password',
        passReqToCallback : true
    },
    (req, username, password, done) =>{
        member.login.tryLogin((users) =>{//model - member 잠고
            //users에 모든 회원의 레코드가 passing 됩니다.
            const ID = req.body.id;
            const PW = req.body.password;
            let NOSUCHUSER = true;
            for(let i=0; i<users.length; i++){
                ((closed_i) =>{//내부에서 hasher를 사용하므로 closer를 이용하여 변수의 값이 유지되도록 합니다.
                    let closed_user = users[closed_i];
                    let closed_no = closed_user.mb_no;
                    let closed_id = closed_user.mb_id;
                    let closed_pw = closed_user.mb_pw;
                    let closed_salt = closed_user.mb_salt;
                    let closed_auth  = closed_user.mb_auth;
                    let closed_active = closed_user.mb_active;

                    if(closed_id == ID){
                        NOSUCHUSER = false;
                        if(closed_auth == false || closed_active == false) return done(null, false);
                        return hasher({password : PW, salt : closed_salt}, (err, pass, salt, hash) =>{
                            //serializer에 세션 키 등록을 요청합니다. user_key가 false라면 passport에 의해 fail로 간주됩니다.
                            if(hash == closed_pw) return done(null, closed_user);
                            else return done(null, false);
                        });
                    }
                })(i)

            }
            if(NOSUCHUSER) return done(null, false);
        });
    }));

    passport.use('request@internalPost', new RequestStrategy(//DB 접속에 대한 권한을 획득하는 request 전략
        (req, done) =>{
            try{
                //유저가 로그인 하면 유저는 deserializer에 의해 token을 얻습니다.

                //해당 token은 POST URL에 필요한 정보로 이루어져있으며 해당 token을
                //decoding하여 POST에서의 권한 문제를 handling 하는데 사용합니다.

                //이 전략은 외부 서버의 post를 통한 회사 DB 접근을 방지하므로
                //post url을 생성하였다면 미들웨어로 이 전략을 등록합니다.

                let token = req.headers.authorization.split("Basic ")[1];
                token =  Buffer.from(token, 'base64').toString('utf8');
                let no = token.split(":")[0];
                let id = token.split(":")[1];
                let name = token.split(":")[2];
                let level = token.split(":")[3];
                let company = token.split(":")[4];

                if(!no || !id) throw(errs.improperRequest);

                user = {"mb_no" : no, "mb_id" : id, "mb_name" : name,"mb_level" : level, "mb_company" : company};

                member.login.findUserById(user.mb_no, (row) =>{
                    try{
                        if(user.mb_id == row.mb_id) done(null, user);
                        else throw(errs.unauthorizedRequest);
                        //if 문을 확장하여 유저의 mb_level을 이용하는 방법도 있습니다.
                    }
                    catch(e){
                        e.from = req.ip.split(":")[3];
                        console.log(e);
                        done(null, false);
                    }
                });
            }
            catch(e){
                e.from = req.ip.split(":")[3];//지정된 방식으로 분류되지 않는 요청을 받을시,
                console.log(e);//요청을 보낸 ip를 추가하여 error에 대한 log를 남깁니다.
                done(null, false);
            }
    }));

};
