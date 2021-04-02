import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import logger from 'morgan';
import indexRouter from './routes/index';
import issuesRouter from './routes/issues';

const app = express();

app.set('trust proxy', true);

app.use(logger('dev'));
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/', indexRouter);
app.use('/issues', issuesRouter);

export default app;
