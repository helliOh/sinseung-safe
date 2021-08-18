const express = require('express');//4.16.3

const app = express();
const multer = require('multer')

const port = 3000;
const nodeadmin = require('nodeadmin');

const passport = require('passport');
const session = require('express-session');
const mysqlStore = require('express-mysql-session');
const path = require('path');

const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const mysql = require('mysql');

const now = new Date();

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(nodeadmin(app));

/***************database configuratrion ********************/
const DB = require('./config/database.js');
const conn = mysql.createConnection(DB.member);
/***************passport configuration ********************/
app.use(session({
  secret: process.env.SESSION_SECRET,
  clearExpired: true,
  expiration: 28800000,// 3 hours
  // connectionLimit: 1, // limit of login of the same user
  resave: false,
  saveUninitialized: true,
  store: new mysqlStore(DB.session)
}));

require('./config/passport')(passport); // pass passport for configuration
app.use(passport.initialize());
app.use(passport.session());
//configuration ===============================================================
conn.connect();
// require('./config/passport')(passport); // pass passport for configuration

//set up our express application
app.use(morgan('dev')); // log every request to the console
// app.use(cookieParser()); // read cookies (needed for auth)

//view engine setup
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'ejs');

//required for passport

// routes ======================================================================
require('./config/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

//launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);

//catch 404 and forward to error handler
app.use(function (req, res, next) {
    res.status(404).render('404', {title: "Sorry, page not found", session: req.session});
});

app.use(function (req, res, next) {
    res.status(500).render('404', {title: "Sorry, page not found"});
});
exports = module.exports = app;
