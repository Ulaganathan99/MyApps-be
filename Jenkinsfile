// pipeline {

//     agent any
    
//     environment {
//         DOCKER_IMAGE = 'myapps-image-be:latest'
//         CONTAINER_NAME = 'myapps-container-be'
//     }

//     stages {
//         stage('Checkout') {
//             steps {
//                 checkout scm  // Check out source code
//             }
//         }

//         stage('Docker Build') {
//             steps {
//                 script {
//                     sh "docker build -t ${DOCKER_IMAGE} -f Dockerfile ."
//                 }
//             }
//         }

//         stage('Update Container') {
//             steps {
//                 script {
//                     sh "docker stop ${CONTAINER_NAME} || true"  // Stop container if running
//                     sh "docker rm ${CONTAINER_NAME} || true"    // Remove container if exists
//                     // Run new container from the updated image based on your Dockerfile
//                     sh "docker run -d --name ${CONTAINER_NAME} --env-file ~/environments/myapps-be/.env -p 3100:3000 ${DOCKER_IMAGE}"

//                      // Prune dangling images after deploying the container
//                     sh "docker image prune -f"
//                 }
//             }
//         }
//     } 
// }

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
                    
                    // Prune dangling images after deploying the container
/                   sh "docker image prune -f"
                }
            }
        }
    }
}