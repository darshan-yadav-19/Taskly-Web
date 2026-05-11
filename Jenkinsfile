pipeline {
    agent any

    environment {
        APP_SERVER = "YOUR_APP_EC2_PRIVATE_IP"
        APP_DIR = "/home/ubuntu/taskly-app"
        REPO_URL = "YOUR_GITHUB_REPO_URL"
    }

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Verify Docker On Jenkins') {
            steps {
                sh 'docker --version'
                sh 'docker compose version || true'
            }
        }

        stage('Deploy To App EC2') {
            steps {

                sshagent(credentials: ['app-ec2-ssh']) {

                    sh """
                        ssh -o StrictHostKeyChecking=no ubuntu@$APP_SERVER '

                            set -e

                            mkdir -p $APP_DIR

                            if [ ! -d "$APP_DIR/.git" ]; then
                                git clone $REPO_URL $APP_DIR
                            fi

                            cd $APP_DIR

                            git pull origin main

                            docker compose down

                            docker compose up --build -d
                        '
                    """
                }
            }
        }

        stage('Health Check') {
            steps {

                sh """
                    curl --fail http://$APP_SERVER/health
                """
            }
        }
    }

    post {

        success {
            echo 'Deployment completed successfully.'
        }

        failure {
            echo 'Pipeline failed. Check Jenkins logs.'
        }

        always {
            cleanWs()
        }
    }
}