var express = require('express');
var path = require('path');
var cors = require('cors');
var helmet = require('helmet');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
