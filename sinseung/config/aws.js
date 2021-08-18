//AWS S3 config - 파일서버
//AWS S3 API doc 참고
const AWS = require('aws-sdk');
AWS.config.region = 'ap-northeast-2';

module.exports = {
  'createConnection' : (params, cb) =>{
    const connType = params.connType;
    let config = {};
    switch(connType){
      case 'put' :
        config = {
          'Bucket' : process.env.FILE_SERVER,
          'Key' : params.dir + params.key,
          'ACL' :  'bucket-owner-full-control',
          'ContentType' : params.mimetype,
          'Body' : params.buffer
        };
        break;
      case 'get' :
        config = {
          'Bucket' : process.env.FILE_SERVER,
          'Key' : params.key
        };
        break;
      case 'list' :
        config = {
          'Bucket' : process.env.FILE_SERVER,
          'Delimiter' : '/',
          'Prefix' : params.dir
        };
        break;
      case 'delete' :
        config = {
          'Bucket' : process.env.FILE_SERVER,
          'Delete' : {
            'Objects' : params.list
          }
        };
        break;
      case 'default' :
        config = {
          'err' : 'connection without defining connection type is prohibited'
        }
        break;
    }

    let conn = createS3();
    cb(config ,conn);
  },
  'getConfig' : () =>{

  }
}

var createS3 = (config) =>{
  return new AWS.S3();
};
