const numeral = require('numeral');
const bcrypt = require('bcrypt-nodejs');
const dateFormat = require('dateformat');
const member = require('../models/member');
const client = require('../models/client');
const errs = require('../../config/errors');

exports.get = {
  'home' : (req, res) =>{
    res.render('commission.ejs', {
      title: '수수료관리::신승CNS',
      user: req.user
    });//으악!
  }
}

exports.post = {

}
