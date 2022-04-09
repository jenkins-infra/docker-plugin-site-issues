import test from 'ava';
import config from '../config.js';

test('config > go', (t) => {
  t.true(!!config);
});
