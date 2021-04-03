import express from 'express';
import { errorReporter } from 'express-youch';
import cors from 'cors';
import helmet from 'helmet';
import logger from 'morgan';
import promMid from 'express-prom-bundle';
import indexRouter from './routes/index';
import issuesRouter from './routes/issues';

const app = express();

app.set('trust proxy', true);
app.set('env', process.env.NODE_ENV || app.get('env') || 'development');

if (app.get('env') == 'production') {
  app.use(logger('combined'));
} else {
  app.use(logger('dev'));
}
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use(promMid({
  includePath: true,
  normalizePath: [
    ['^/issues/.*/open', '/issues/#plugin/open'],
  ],
}));
/* anything registered after this will be included in prom middleware */

app.use('/', indexRouter);
app.use('/issues', issuesRouter);

app.use(errorReporter({
  links: [
    ({ message }) => {
      const url = `https://stackoverflow.com/search?q=${encodeURIComponent(`[node.js] ${message}`)}`;
      return `<a href="${url}" target="_blank" title="Search on stackoverflow">Search stackoverflow</a>`;
    },
  ],
}));

export default app;
