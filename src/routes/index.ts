import path from 'path';
import { readFileSync } from 'fs';
import {
  Router, Request, Response,
} from 'express';

const pkg = JSON.parse(readFileSync(path.join(__dirname, '..', '..', 'package.json')).toString());

const router = Router();

/* GET home page. */
router.get('/', (_req: Request, res: Response) => {
  res.type('text').send('OK');
});

router.get('/healthcheck', (_req: Request, res: Response) => {
  res.type('text').send('OK');
});

router.get('/info', (_req: Request, res: Response) => {
  res.json({
    commit: pkg.version,
    version: pkg.version,
  });
});

export default router;
