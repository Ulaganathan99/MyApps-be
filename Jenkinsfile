
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
                    sh "docker-compose build"  // Build the Docker services defined in the compose file
                }
            }
        }

        stage('Scale Services') {
            steps {
                script {
                    sh "docker-compose up --scale nodejs=3 -d"  // Scale the 'nodejs' service to 3 replicas
                }
            }
        }
    }
}