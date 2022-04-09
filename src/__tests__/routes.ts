import test from 'ava';
import httpMocks from 'node-mocks-http';
import {
  indexRoute,
  healthcheckRoute,
  infoRoute,
  issuesRoute,
} from '../routes.js';
// @ts-ignore
import { setupTests } from '../ava-nock/src/index.js';
import { DB } from '../db.js';

setupTests(test);

test('routes > infoRoute > should return 200 with commit and version', async (t) => {
  const req = httpMocks.createRequest();
  req.db = new DB();
  const res = httpMocks.createResponse();

  infoRoute(req, res);

  const data = res._getJSONData();
  t.is(200, res.statusCode);

  t.true(res._isEndCalled());
  t.true(res._isJSON());
  t.true(res._isUTF8());

  t.truthy(data.commit);
  t.truthy(data.version);
});

test('routes > healthcheckRoute > should return 200', async (t) => {
  const req = httpMocks.createRequest();
  req.db = new DB();
  const res = httpMocks.createResponse();

  healthcheckRoute(req, res);

  t.is('OK', res._getData());
  t.is('text/plain', res.getHeader('Content-Type') as string);
});

test('routes > indexRoute > should return 200', async (t) => {
  const req = httpMocks.createRequest();
  req.db = new DB();
  const res = httpMocks.createResponse();

  indexRoute(req, res);

  t.is('OK', res._getData());
  t.is('text/plain', res.getHeader('Content-Type') as string);
});

test('routes > issuesRoute > should return 200', async (t) => {
  const req = httpMocks.createRequest({ params: { plugin: 'configuration-as-code' } });
  req.db = new DB();
  const res = httpMocks.createResponse();

  await issuesRoute(req, res);

  t.is(200, res.statusCode);
  t.true(res._isJSON());
  t.true(res._isUTF8());
  t.snapshot(res._getJSONData());
});

test('routes > issuesRoute > should return 404 on missing plugin', async (t) => {
  const req = httpMocks.createRequest({ params: { plugin: '---missing-plugin' } });
  req.db = new DB();
  const res = httpMocks.createResponse();

  await issuesRoute(req, res);

  t.is(404, res.statusCode);
});
