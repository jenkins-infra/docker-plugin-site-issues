# docker-plugin-site-issues

[![](https://img.shields.io/docker/pulls/jenkinsciinfra/plugin-site-issues?label=jenkinsciinfra%2Fplugin-site-issues&logo=docker&logoColor=white)](https://hub.docker.com/r/jenkinsciinfra/plugin-site-issues/tags)

Docker image containing a NodeJS service used by [the plugins site](plugins.jenkins.io) to retrieve release and issue information about a plugin.

It fetches data from [the reporting service](https://reports.jenkins.io/issues.index.json), [Update Center](https://updates.jenkins.io/current/update-center.actual.json), [Jira issues](https://issues.jenkins.io) and GitHub API (releases & issues).
