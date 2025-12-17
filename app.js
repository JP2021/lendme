var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport = require ("passport");
const authMiddleware = require("./authenticationMiddleware");
const authorizationMiddleware = require("./authorizationMiddleware");
const session = require("express-session");
const MongoStore = require("connect-mongo");


var indexRouter = require('./routes/index');
var loginRouter = require('./routes/login');
var usersRouter = require('./routes/users');
var customersRouter = require('./routes/customers');
var buscaRouter = require("./routes/busca");
var osRouter = require("./routes/os");
var speechRouter = require("./routes/speech");
var editspeechEditorRouter = require("./routes/editspeechEditor");
var autoTextRouter = require("./routes/autotext")
var inviteRouter = require("./routes/invite");
var registerRouter = require("./routes/register");
var friendsRouter = require("./routes/friends");



var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
authMiddleware(passport);
app.use(session({
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_CONNECTION,
    dbName: process.env.MONGODB_DATABASE,
    ttl: 30 * 60,
    autoRemove: "native"


  }),
  secret: process.env.MONGO_STORE_SCRET,
  resave: false,
  saveUninitialized: false,
  cookie: {maxAge: 30 * 60 * 1000},
  rolling: true
}))
app.use(passport.initialize());
app.use(passport.session());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/', loginRouter);
app.use('/', authorizationMiddleware,speechRouter);
app.use('/',authorizationMiddleware,editspeechEditorRouter);
app.use('/index', authorizationMiddleware, indexRouter);
app.use('/users', authorizationMiddleware, usersRouter);
app.use('/customers', authorizationMiddleware, customersRouter);
app.use('/os', authorizationMiddleware, osRouter);
app.use('/busca', buscaRouter);
app.use('/', authorizationMiddleware, autoTextRouter)
// APIs JSON
app.use('/api', inviteRouter);
app.use('/api', registerRouter);
app.use('/api', friendsRouter);
app.use('/api', require('./routes/products'));
app.use('/api', require('./routes/trades'));
app.use('/api', require('./routes/tradeMessages'));
app.use('/api', require('./routes/profile'));
app.use('/api', require('./routes/notifications'));
app.use('/api', require('./routes/donations'));
app.use('/api', require('./routes/donationMessages'));
app.use('/api', require('./routes/loans'));
app.use('/api', require('./routes/loanMessages'));
app.use('/api', require('./routes/messages'));
app.use('/api', require('./routes/posts'));



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
