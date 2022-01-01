process.env.NODE_ENV = 'test';

if (process.env.JEST_PLAYBACK_MODE !== 'record') {
  process.env.GITHUB_APP_PRIVATE_KEY = Buffer.from('foobar').toString('base64');
  process.env.JIRA_URL = 'http://fake.jira';
  process.env.JIRA_USERNAME = 'fakeuser';
  process.env.JIRA_PASSWORD = 'fakepassword';
  process.env.GITHUB_APP_ID = 'github_app_id';
  jest.setTimeout(60 * 1000);
}
