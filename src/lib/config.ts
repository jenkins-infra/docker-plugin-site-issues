// import fs from 'fs';

export class Config {
  readonly jira: {
    readonly url: string
    readonly username: string
    readonly password: string
  };

  readonly github: {
    readonly appId: string
    readonly privateKey: string
  };

  constructor() {
    this.jira = {
      url: process.env.JIRA_URL || 'https://issues.jenkins.io',
      username: process.env.JIRA_USERNAME || '',
      password: process.env.JIRA_PASSWORD || '',
    };
    this.github = {
      appId: process.env.GITHUB_APP_ID || '',
      privateKey: '',
      // privateKey: fs.readFileSync(process.env.GITHUB_APP_PRIVATE_KEY).toString(),
    };
  }
}

const config = new Config();

if (!config.jira.username) {
  throw new Error('JIRA_USERNAME not set');
}

if (!config.jira.password) {
  throw new Error('JIRA_PASSWORD not set');
}

export default config;
