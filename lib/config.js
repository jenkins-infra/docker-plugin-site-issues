const fs = require('fs');
const deepFreeze = require('deep-freeze');

const config = {
  github: {
    //appId: process.env.GITHUB_APP_ID,
    //privateKey: fs.readFileSync(process.env.GITHUB_APP_PRIVATE_KEY).toString(),
  },
  jira: {
    url: process.env.JIRA_URL || 'https://issues.jenkins.io',
    username: process.env.JIRA_USERNAME,
    password: process.env.JIRA_PASSWORD,
  },
};
deepFreeze(config);
module.exports = config;
