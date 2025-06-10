import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import logger from 'morgan';
import promMid from 'express-prom-bundle';
import asyncHandler from 'express-async-handler';
import {
  indexRoute, healthcheckRoute, infoRoute, issuesRoute, releasesRoute,
} from './routes.js';
import { DB } from './db.js';

const app = express();

declare module 'express-serve-static-core' {
  interface Request {
    db: DB
  }
}

app.set('trust proxy', true);
app.set('env', process.env.NODE_ENV || app.get('env') || 'development');
app.set('db', new DB());

app.use(function (req, _res, next) {
  req.db = app.get('db');
  next();
});
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
const getRoutes: string[] = [];
const get = (path: string, route: (req: Request, res: Response) => void) => {
  app.get(path, asyncHandler(route));
  getRoutes.push(path);
};
get('/', indexRoute);
get('/info/healthcheck', healthcheckRoute);
get('/info/routes', (_, res) => { res.json({ 'get': getRoutes }); });
get('/info', infoRoute);
get('/api/plugin/:plugin/issues/open', issuesRoute);
get('/api/plugin/:plugin/releases', releasesRoute);

app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  console.log(err);

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
  next(err);
});

//app.use(errorReporter({
//  links: [
//    ({ message }) => {
//      const url = `https://stackoverflow.com/search?q=${encodeURIComponent(`[node.js] ${message}`)}`;
//      return `<a href="${url}" target="_blank" title="Search on stackoverflow">Search stackoverflow</a>`;
//    },
//  ],
//}));

export default app;
