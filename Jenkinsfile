#!groovy

node {
    def webRoot = "/www1/"

    stage 'Checkout code'
    checkout scm

    stage 'Deploy rsync'
    def deployScript = "mkdir -p ${webRoot}${env.JOB_NAME} ; rsync -av ./* ${webRoot}${env.JOB_NAME}"
    sh "${deployScript}"

    stage 'Reset Opcache'
    sh 'curl -s http://127.0.0.1/reset_opcache.php'
}
