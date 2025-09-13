pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/hazelous/8.2CDevSecOps.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                bat 'npm test || exit /b 0'  // Allows pipeline to continue despite test failures
            }
        }

        stage('Generate Coverage Report') {
            steps {
                bat 'npm run coverage || exit /b 0'
            }
        }

        stage('NPM Audit (Security Scan)') {
            steps {
                bat 'npm audit || exit /b 0'
            }
        }

        stage('SonarCloud Analysis') {
            steps {
                // Securely expose SONAR_TOKEN only during this stage
                withCredentials([string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_TOKEN')]) {
        
                    // download the SonarScanner CLI as a zip
                    bat 'powershell -Command "Invoke-WebRequest -Uri https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-windows.zip -OutFile sonar-scanner.zip"'
        
                    // extract it to a folder
                    // (re-extracting is fine; -Force overwrites)
                    bat 'powershell -Command "Expand-Archive -Path sonar-scanner.zip -DestinationPath sonar-scanner -Force"'
        
                    // run the scanner and pass the token
                    bat 'sonar-scanner\\sonar-scanner-5.0.1.3006-windows\\bin\\sonar-scanner.bat -Dsonar.login=%SONAR_TOKEN%'
            }
    }
}
    }
}
