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
          curl -qsL https://github.com/crate-ci/typos/releases/download/v1.33.1/typos-v1.33.1-x86_64-unknown-linux-musl.tar.gz | tar xvzf - ./typos
          ./typos --format sarif > out.sarif || true
        '''
        recordIssues(tools: [sarif(id: 'typos', name: 'Typos', pattern: 'out.sarif')])
      }
    }

    stage('Lint and test') {
      agent {
        docker {
          image 'node:20.18.0'
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
