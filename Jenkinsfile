pipeline {
    agent none
    environment {
        DOCKERHUB_CREDENTIALS = credentials('DockerLogin')
        DEPLOY_USERNAME = 'ubuntu'
        DEPLOYMENT_IP = '192.168.0.12'
    }
    stages {
        stage('Build') {
            agent {
                docker {
                    image 'node:lts-buster-slim'
                }
            }
            steps {
                sh 'npm install'
            }
        }
        stage('Build Docker Image and Push to Docker Registry') {
            agent {
                docker {
                    image 'docker:dind'
                    args '--user root -v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            steps {
                sh 'docker build -t xenjutsu/nodejsgoof:latest .'
                sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'
                sh 'docker push xenjutsu/nodejsgoof:latest'
            }
        }
        stage('Deploy Docker Image') {
            agent {
                docker {
                    image 'kroniak/ssh-client'
                    args '--user root -v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: "DeploymentSSHKey", keyFileVariable: 'keyfile')]) {
                    sh 'ssh -i ${keyfile} -o StrictHostKeyChecking=no $DEPLOY_USERNAME@$DEPLOYMENT_IP "echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin"'
                    sh 'ssh -i ${keyfile} -o StrictHostKeyChecking=no $DEPLOY_USERNAME@$DEPLOYMENT_IP docker pull xenjutsu/nodejsgoof:latest'
                    sh 'ssh -i ${keyfile} -o StrictHostKeyChecking=no $DEPLOY_USERNAME@$DEPLOYMENT_IP docker rm --force mongodb'
                    sh 'ssh -i ${keyfile} -o StrictHostKeyChecking=no $DEPLOY_USERNAME@$DEPLOYMENT_IP docker run --detach --name mongodb -p 27017:27017 mongo:3'
                    sh 'ssh -i ${keyfile} -o StrictHostKeyChecking=no $DEPLOY_USERNAME@$DEPLOYMENT_IP docker rm --force nodejsgoof'
                    sh 'ssh -i ${keyfile} -o StrictHostKeyChecking=no $DEPLOY_USERNAME@$DEPLOYMENT_IP docker run -it --detach --name nodejsgoof --network host xenjutsu/nodejsgoof:latest'
                }
            }
        }
    }
}
