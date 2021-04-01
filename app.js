const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const issuesRouter = require('./routes/issues');

const app = express();

app.set('trust proxy', true);

app.use(logger('dev'));
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/', indexRouter);
app.use('/issues', issuesRouter);

module.exports = app;
