import test from 'ava';
import nock from 'nock';
import httpMocks from 'node-mocks-http';
import {
  indexRoute,
  healthcheckRoute,
  infoRoute,
  issuesRoute,
} from '../routes.js';
import { DB } from '../db.js';
import { clear } from 'typescript-memoize';

test.beforeEach(() => {
  nock.disableNetConnect();
  clear(['db']);
});

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
  nock('https://reports.jenkins.io').get('/issues.index.json')
    .replyWithFile(200, 'src/__mocks__/issues.index.json', { 'Content-Type': 'application/json' });
  nock('https://api.github.com').get('/app/installations')
    .replyWithFile(200, 'src/__mocks__/github_installations.json', { 'Content-Type': 'application/json' });
  nock('https://api.github.com').post('/app/installations/12345/access_tokens')
    .replyWithFile(200, 'src/__mocks__/github_access_tokens.json', { 'Content-Type': 'application/json' });
  nock('https://api.github.com')
    .get('/repos/jenkinsci/configuration-as-code-plugin/issues')
    .query({ per_page: 100, state: 'open' })
    .replyWithFile(200, 'src/__mocks__/github-configuration-as-code-issues.json', { 'Content-Type': 'application/json' });
  nock('https://issues.jenkins.io:443').post('/rest/api/2/search', {
    'fields': [
      'key',
      'components',
      'summary',
      'assignee',
      'reporter',
      'priority',
      'status',
      'resolution',
      'created',
      'updated',
    ],
    'jql': 'project=JENKINS AND status in ("Open","In Progress","Reopened") AND component=23170',
    'maxResults': 1000,
    'startAt': 0,
  }).replyWithFile(200, 'src/__mocks__/jira-configuration-as-code-issues.json', { 'Content-Type': 'application/json' });

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
  nock('https://reports.jenkins.io').get('/issues.index.json')
    .replyWithFile(200, 'src/__mocks__/issues.index.json', { 'Content-Type': 'application/json' });

  const req = httpMocks.createRequest({ params: { plugin: '---missing-plugin' } });
  req.db = new DB();
  const res = httpMocks.createResponse();

  await issuesRoute(req, res);

  t.is(404, res.statusCode);
});
