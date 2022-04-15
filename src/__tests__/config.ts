import test from 'ava';
import nock from 'nock';
import config from '../config.js';
import { clear } from 'typescript-memoize';

test.beforeEach(() => {
  nock.disableNetConnect();
  clear(['db']);
});

test('config > go', (t) => {
  t.true(!!config);
});
