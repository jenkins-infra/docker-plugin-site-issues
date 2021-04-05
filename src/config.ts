import fs from 'fs';

export class Config {
  readonly jira: {
    readonly url: string
    readonly username: string
    readonly password: string
  };

  readonly github: {
    readonly server: string | undefined
    readonly appId: string
    readonly privateKey: string
  };

  constructor() {
    let githubPrivateKey = '';
    if (process.env.GITHUB_APP_PRIVATE_KEY) {
      if (fs.existsSync(process.env.GITHUB_APP_PRIVATE_KEY)) {
        githubPrivateKey = fs.readFileSync(process.env.GITHUB_APP_PRIVATE_KEY).toString();
      } else {
        githubPrivateKey = Buffer.from(process.env.GITHUB_APP_PRIVATE_KEY, 'base64').toString('ascii');
      }
    }
    this.jira = {
      url: process.env.JIRA_URL || 'https://issues.jenkins.io',
      username: process.env.JIRA_USERNAME || '',
      password: process.env.JIRA_PASSWORD || '',
    };
    this.github = {
      server: process.env.GITHUB_SERVER,
      appId: process.env.GITHUB_APP_ID || '',
      privateKey: githubPrivateKey,
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
