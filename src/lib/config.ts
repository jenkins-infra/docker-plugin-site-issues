import fs from 'fs';

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
      privateKey: (process.env.GITHUB_APP_PRIVATE_KEY && fs.existsSync(process.env.GITHUB_APP_PRIVATE_KEY) ? fs.readFileSync(process.env.GITHUB_APP_PRIVATE_KEY || '').toString() : process.env.GITHUB_APP_PRIVATE_KEY) || '',
    };

    if (!this.jira.username) {
      throw new Error('JIRA_USERNAME not set');
    }

    if (!this.jira.password) {
      throw new Error('JIRA_PASSWORD not set');
    }

    if (!this.github.appId) {
      throw new Error('GITHUB_APP_ID not set');
    }

    if (!this.jira.password) {
      throw new Error('GITHUB_APP_PRIVATE_KEY not set');
    }
  }
}

const config = new Config();

export default config;
