pipeline {
  environment {
    GET_CONTENT = "true"
    HOME = "/tmp"
    TZ = "UTC"
  }

  agent {
    label 'docker&&linux'
  }

  options {
    timeout(time: 60, unit: 'MINUTES')
    ansiColor('xterm')
    buildDiscarder logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '5', numToKeepStr: '5')
  }

  stages {
    stage('Check for typos') {
      steps {
        sh '''
          curl -qsL https://github.com/crate-ci/typos/releases/download/v1.6.0/typos-v1.6.0-x86_64-unknown-linux-musl.tar.gz | tar xvzf - ./typos
          curl -qsL https://github.com/halkeye/typos-json-to-checkstyle/releases/download/v0.1.1/typos-checkstyle-v0.1.1-x86_64 > typos-checkstyle && chmod 0755 typos-checkstyle
          ./typos --format json | ./typos-checkstyle - > checkstyle.xml || true
        '''
        recordIssues(tools: [checkStyle(id: 'typos', name: 'Typos', pattern: 'checkstyle.xml')])
      }
    }

    stage('Lint and test') {
      agent {
        docker {
          image 'node:16.13.1'
          reuseNode true
        }
      }
      steps {
        sh 'npm clean-install'
        sh 'npm run build'
        sh 'npm run lint'
        sh 'npm run test -- --tap | npx tap-xunit > junit.xml || true'
        junit 'junit.xml'
      }
    }
  }
}
