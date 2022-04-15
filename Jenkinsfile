pipeline {
  environment {
    GET_CONTENT = "true"
    NODE_ENV = "production"
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

    stage('NPM Install') {
      agent {
        docker {
          image 'node:16.13.1'
          reuseNode true
        }
      }
      steps {
        sh 'yarn install'
      }
    }

    stage('Build Production') {
      agent {
        docker {
          image 'node:16.13.1'
          reuseNode true
        }
      }
      steps {
        sh 'npm run build'
      }
    }

    stage('Lint') {
      agent {
        docker {
          image 'node:16.13.1'
          reuseNode true
        }
      }
      steps {
        sh 'npm run lint'
      }
    }

    stage('Test') {
      agent {
        docker {
          image 'node:16.13.1'
          reuseNode true
        }
      }
      steps {
        sh 'npm run test | npx tap-xunit > junit.xml'
        junit 'junit.xml'
      }
    }
  }
}
