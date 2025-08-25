pipeline {
  agent any
  stages {
    stage('Checkout') {
      steps {
        git url: 'git@github.com:atiradonet/nodejs-goof.git', branch: 'main'
      }
    }
    stage('Snyk Open Source Test') {
      steps {
        // Run Snyk test and fail build on high severity issues
        withEnv(["SNYK_TOKEN=${env.SNYK_TOKEN}"]) {
          sh 'npx snyk test --severity-threshold=high'
        }
      }
    }
  }
}
