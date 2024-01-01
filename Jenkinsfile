// pipeline {

//     agent any
    
//     stages{

//         stage('Install Dependencies'){
//             steps {
//                 sh 'npm install'
//             }
//         }
//         stage('Test'){
//             steps {
//                 sh 'echo "testing application..."'
//             }
//         }
//         stage('Deploy'){
//             steps {
//                 sh 'echo "deploying application"'
//             }
//         }
//     }
// }
pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = 'myapps-image-be'
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
                    sh "docker build -t ${DOCKER_IMAGE} -f Dockerfile ."  // Build Docker image using your Dockerfile
                }
            }
        }

        stage('Update Container') {
            steps {
                script {
                    sh "docker stop ${CONTAINER_NAME} || true"  // Stop container if running
                    sh "docker rm ${CONTAINER_NAME} || true"    // Remove container if exists

                    // Run new container from the updated image based on your Dockerfile
                    sh "docker run -d --name ${CONTAINER_NAME} -p 4222:8080 ${DOCKER_IMAGE}"
                }
            }
        }
    }
}