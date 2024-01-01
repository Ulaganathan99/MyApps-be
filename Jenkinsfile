pipeline {

    agent any
    
    environment {
        DOCKER_IMAGE = 'myapps-image-be:latest'
        CONTAINER_NAME = 'myapps-container-be'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm  // Check out source code
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    sh "docker build -t ${DOCKER_IMAGE} -f Dockerfile ."
                }
            }
        }

        stage('Update Container') {
            steps {
                script {
                    sh "docker stop ${CONTAINER_NAME} || true"  // Stop container if running
                    sh "docker rm ${CONTAINER_NAME} || true"    // Remove container if exists
                    // Run new container from the updated image based on your Dockerfile
                    sh "docker run -d --name ${CONTAINER_NAME} --env-file ~/environments/myapps-be/.env -p 4222:3000 ${DOCKER_IMAGE}"

                     // Prune dangling images after deploying the container
                    sh "docker image prune -f"
                }
            }
        }
    } 
}