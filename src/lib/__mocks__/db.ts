export async function getIssuesForPlugin(pluginId: string) {
  if (pluginId === 'configuration-as-code') {
    return [
      {
        type: 'github',
        reference: 'jenkinsci/configuration-as-code-plugin',
        viewUrl: 'https://github.com/jenkinsci/configuration-as-code-plugin/issues',
        reportUrl: 'https://github.com/jenkinsci/configuration-as-code-plugin/issues/new/choose',
      },
      {
        type: 'jira',
        reference: '23170',
        viewUrl: 'https://issues.jenkins.io/issues/?jql=component=23170',
      },
    ];
  }
  return null;
}

export async function getGithubIssues() {
  return [
    {
      assignee: '',
      created: '2021-03-29T05:04:57Z',
      issueType: 'dependencies',
      key: '#1588',
      priority: '',
      reporter: 'dependabot[bot]',
      resolution: 'open',
      status: 'open',
      summary: 'Bump artifactory from 3.4.0 to 3.10.6',
      updated: '2021-03-29T05:05:00Z',
      url: 'https://github.com/jenkinsci/configuration-as-code-plugin/pull/1588',
    },
    {
      assignee: '',
      created: '2021-03-22T05:02:03Z',
      issueType: 'dependencies',
      key: '#1585',
      priority: '',
      reporter: 'dependabot[bot]',
      resolution: 'open',
      status: 'open',
      summary: 'Bump aws-java-sdk from 1.11.457 to 1.11.976',
      updated: '2021-03-22T05:02:07Z',
      url: 'https://github.com/jenkinsci/configuration-as-code-plugin/pull/1585',
    },
  ];
}

export async function getJiraIssues() {
  return [
    {
      created: '2021-01-19T23:32:27.000+0000',
      issueType: 'Bug',
      key: 'JENKINS-64664',
      priority: 'Minor',
      reporter: 'Kevin Carrasco',
      summary: 'Kubernetes plugin jCasC compatibility issue',
      updated: '2021-02-05T09:42:22.000+0000',
      url: 'https://issues.jenkins.io/browse/JENKINS-64664',
    },
  ];
}
