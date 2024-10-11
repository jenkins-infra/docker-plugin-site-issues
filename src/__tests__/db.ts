import test from 'ava';
import nock from 'nock';
import { DB } from '../db.js';
import { clear } from 'typescript-memoize';

test.beforeEach(() => {
  nock.disableNetConnect();
  clear(['db']);
});

test('db > getGithubIssues > succeeds', async (t) => {
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

  const db = new DB();
  const issues = await db.getGithubIssues('jenkinsci/configuration-as-code-plugin');
  t.snapshot(issues);
});

test('db > getJiraIssues > succeeds', async (t) => {
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
    'jql': 'project=JENKINS AND status in ("Open","In Progress","Reopened") AND component=21481',
    'maxResults': 1000,
    'startAt': 0,
  }).replyWithFile(200, 'src/__mocks__/jira-configuration-as-code-issues.json', { 'Content-Type': 'application/json' });

  const db = new DB();
  const issues = await db.getJiraIssues(21481);
  t.snapshot(issues);
});

test('db > getGithubReleases > succeeds', async (t) => {
  nock('https://api.github.com').get('/app/installations')
    .replyWithFile(200, 'src/__mocks__/github_installations.json', { 'Content-Type': 'application/json' });
  nock('https://api.github.com')
    .get('/repos/jenkinsci/credentials-plugin/releases')
    .replyWithFile(200, 'src/__mocks__/github-credentials-releases.json', { 'Content-Type': 'application/json' });

    const db = new DB();
    const releases = await db.getGithubReleases('jenkinsci/credentials-plugin');
    t.snapshot(releases);
});
