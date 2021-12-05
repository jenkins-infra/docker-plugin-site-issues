import express from 'express';
import { errorReporter } from 'express-youch';
import cors from 'cors';
import helmet from 'helmet';
import logger from 'morgan';
import promMid from 'express-prom-bundle';
import asyncHandler from 'express-async-handler';
import {
  indexRoute, healthcheckRoute, infoRoute, issuesRoute,
} from './routes';

const app = express();

app.set('trust proxy', true);
app.set('env', process.env.NODE_ENV || app.get('env') || 'development');

if (app.get('env') === 'production') {
  app.use(logger('combined'));
} else if (app.get('env') === 'test') {
  /* Dont log */
} else {
  app.use(logger('dev'));
}
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use(promMid({
  includePath: true,
  normalizePath: [
    ['^/api/plugins/.*/open', '/api/plugins/#plugin/open'],
  ],
}));
/* anything registered after this will be included in prom middleware */

app.get('/', asyncHandler(indexRoute));
app.get('/healthcheck', asyncHandler(healthcheckRoute));
app.get('/info', asyncHandler(infoRoute));
app.get('/api/plugins/:plugin/issues/open', asyncHandler(issuesRoute));

app.use(errorReporter({
  links: [
    ({ message }) => {
      const url = `https://stackoverflow.com/search?q=${encodeURIComponent(`[node.js] ${message}`)}`;
      return `<a href="${url}" target="_blank" title="Search on stackoverflow">Search stackoverflow</a>`;
    },
  ],
}));

export default app;
