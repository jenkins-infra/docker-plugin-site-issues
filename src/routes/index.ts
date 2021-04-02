import express from 'express';

const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.send('OK');
});

router.get('/healthcheck', (req, res, next) => {
  res.send('OK');
});

export default router;
