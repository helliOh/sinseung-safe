const stream = require('stream');
const jschardet = require("jschardet");
const iconv = require('iconv-lite');

module.exports = {
    "decodePipeLine" : (cb) =>{
        let readStream = new stream.PassThrough()
            .on('error', (err) =>{console.log(err);})
            .on('data', () =>{console.log();})
            .on('close', () => {})
            .on('unpipe', () =>{})
            .on('end', () =>{console.log();});

        let decodeStream = iconv.decodeStream('EUC-KR')
            .on('error', (err) =>{})
            .on('data', () =>{})
            .on('close', () => {})
            .on('unpipe', () =>{})
            .on('end', () =>{readStream.end();});

        let destStream = new stream.PassThrough()
            .on('error', (err) =>{console.log(err);})
            .on('data', () =>{})
            .on('close', () => {})
            .on('unpipe', () =>{})
            .on('end', () =>{decodeStream.end();});

        readStream.pipe(decodeStream).pipe(destStream);

        return cb(readStream, destStream);
    },
    "encodePipeLine" : (cb) =>{
        let readStream = new stream.PassThrough()
            .on('error', (err) =>{console.log(err);})
            .on('data', (chunk) =>{})
            .on('close', () => {})
            .on('unpipe', () =>{})
            .on('end', () =>{console.log();});

        let encodeStream = iconv.encodeStream('EUC-KR')
            .on('error', (err) =>{})
            .on('data', (chunk) =>{console.log(chunk);})
            .on('close', () => {})
            .on('unpipe', () =>{})
            .on('end', () =>{readStream.end();});

        readStream.pipe(encodeStream);

        return cb(readStream, encodeStream);
    },
    "decode" : (data) =>{
        return iconv.decode(data, 'EUC-KR');
    },
    "encode" : (data) =>{
        return iconv.encode(data, 'EUC-KR');
    },
    "detect" : (data) =>{
        return jschardet.detect(data);
    },
}
