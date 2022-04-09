import fs from 'fs';

// from https://stackoverflow.com/questions/8571501/how-to-check-whether-a-string-is-base64-encoded-or-not
const BASE64_REGEX = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;

export class Config {
  readonly jira: {
    readonly url: string
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
      } else if (BASE64_REGEX.test(process.env.GITHUB_APP_PRIVATE_KEY)) {
        githubPrivateKey = Buffer.from(process.env.GITHUB_APP_PRIVATE_KEY, 'base64').toString('ascii');
      } else {
        githubPrivateKey = process.env.GITHUB_APP_PRIVATE_KEY;
      }
    }
    this.jira = {
      url: process.env.JIRA_URL || 'https://issues.jenkins.io',
    };
    this.github = {
      server: process.env.GITHUB_SERVER,
      appId: process.env.GITHUB_APP_ID || '',
      privateKey: githubPrivateKey,
    };

    if (!this.github.appId) {
      throw new Error('GITHUB_APP_ID not set');
    }

    if (!this.github.privateKey) {
      throw new Error('GITHUB_APP_PRIVATE_KEY not set');
    }
  }
}

const config = new Config();

export default config;
