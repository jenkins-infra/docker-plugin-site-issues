import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import logger from 'morgan';
import compression from 'compression';
import indexRouter from './routes/index';
import issuesRouter from './routes/issues';

const app = express();

app.set('trust proxy', true);
app.set('env', process.env.NODE_ENV || app.get('env') || 'development'));

if (app.get('env') == 'production') {
  app.use(logger('combined'));
} else {
  app.use(logger('dev'));
}
app.use(compression())
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/', indexRouter);
app.use('/issues', issuesRouter);

export default app;
