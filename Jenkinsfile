pipeline {
    agent any
    
    environment {
        // Docker registry details
        DOCKER_REGISTRY = 'your-registry.com'
        IMAGE_NAME = 'todo-app'
        IMAGE_TAG = "${BUILD_NUMBER}"
        
        // SonarQube
        SONAR_HOST_URL = 'http://localhost:9000'
        SONAR_LOGIN = credentials('sonar-token')
        
        // OWASP Dependency Check
        // OWASP_DC_VERSION = '8.4.0'
    }
    
    tools {
        nodejs 'NodeJS-18'
    }
    
    stages {
        stage('📥 Checkout') {
            steps {
                echo '🔄 Checking out code from repository...'
                checkout scm
            }
        }
        
        stage('📦 Install Dependencies') {
            steps {
                echo '📦 Installing Node.js dependencies...'
                sh 'npm ci'
            }
        }
        
        stage('🧪 Unit Tests') {
            steps {
                echo '🧪 Running unit tests...'
                sh '''
                    # Run tests with coverage
                    npm test -- --coverage --ci --watchAll=false --verbose
                    
                    # Verify test results
                    if [ $? -eq 0 ]; then
                        echo "✅ All tests passed!"
                    else
                        echo "❌ Some tests failed!"
                        exit 1
                    fi
                    
                    # Check if coverage was generated
                    if [ -f coverage/lcov.info ]; then
                        echo "✅ Coverage report generated successfully"
                    else
                        echo "⚠️  Coverage report not found"
                    fi
                '''
            }
            post {
                always {
                    // Publish coverage report (HTML)
                    script {
                        if (fileExists('coverage/lcov-report/index.html')) {
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'coverage/lcov-report',
                                reportFiles: 'index.html',
                                reportName: 'Test Coverage Report'
                            ])
                        } else {
                            echo "⚠️  Coverage HTML report not found"
                        }
                    }
                    
                    // Archive coverage data
                    archiveArtifacts artifacts: 'coverage/**/*', allowEmptyArchive: true
                }
            }
        }
        
        stage('📊 Code Quality Analysis - SonarQube') {
            steps {
                echo '📊 Running SonarQube analysis...'
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        npx sonar-scanner \
                        -Dsonar.projectKey=todo-app \
                        -Dsonar.sources=src \
                        -Dsonar.tests=tests \
                        -Dsonar.host.url=${SONAR_HOST_URL} \
                        -Dsonar.login=${SONAR_LOGIN}
                    '''
                }
            }
        }
        
        stage('🔍 Quality Gate') {
            steps {
                echo '🔍 Checking SonarQube Quality Gate...'
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        
        stage('🔒 OWASP Dependency Check') {
            steps {
                echo '🔒 Running OWASP Dependency Check...'
                script {
                    sh '''
                        # Download and run OWASP Dependency Check
                        OWASP_DC_VERSION="8.4.0"
                        OWASP_DC_DIR="dependency-check"
                        
                        # Check if already downloaded
                        if [ ! -d "$OWASP_DC_DIR" ]; then
                            echo "📥 Downloading OWASP Dependency Check..."
                            wget -q https://github.com/jeremylong/DependencyCheck/releases/download/v${OWASP_DC_VERSION}/dependency-check-${OWASP_DC_VERSION}-release.zip
                            unzip -q dependency-check-${OWASP_DC_VERSION}-release.zip
                            chmod +x dependency-check/bin/dependency-check.sh
                        fi
                        
                        # Run dependency check
                        echo "🔍 Running dependency scan..."
                        ./dependency-check/bin/dependency-check.sh \\
                            --project "todo-app" \\
                            --scan . \\
                            --format XML \\
                            --format HTML \\
                            --format JSON \\
                            --out dependency-check-report \\
                            --suppression owasp-suppressions.xml || true
                        
                        # Check results
                        if [ -f dependency-check-report/dependency-check-report.html ]; then
                            echo "✅ OWASP Dependency Check completed successfully"
                            
                            # Check for vulnerabilities
                            if [ -f dependency-check-report/dependency-check-report.json ]; then
                                VULN_COUNT=$(cat dependency-check-report/dependency-check-report.json | jq '.dependencies[]?.vulnerabilities[]?' | wc -l)
                                echo "Found $VULN_COUNT vulnerabilities"
                                
                                if [ $VULN_COUNT -gt 0 ]; then
                                    echo "⚠️  Vulnerabilities found! Review the report."
                                    # Uncomment to fail pipeline on vulnerabilities
                                    # exit 1
                                fi
                            fi
                        else
                            echo "❌ OWASP Dependency Check failed"
                            exit 1
                        fi
                    '''
                }
            }
            post {
                always {
                    // Archive the reports
                    archiveArtifacts artifacts: 'dependency-check-report/**/*', allowEmptyArchive: true
                    
                    // Publish HTML report
                    script {
                        if (fileExists('dependency-check-report/dependency-check-report.html')) {
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'dependency-check-report',
                                reportFiles: 'dependency-check-report.html',
                                reportName: 'OWASP Dependency Check Report'
                            ])
                        }
                    }
                }
            }
            }
        
        stage('🐳 Build Docker Image') {
            steps {
                echo '🐳 Building Docker image...'
                script {
                    dockerImage = docker.build("${IMAGE_NAME}:${IMAGE_TAG}")
                }
            }
        }
        
        stage('🛡️ Container Security Scan - Trivy') {
            steps {
                echo '🛡️ Running Trivy security scan...'
                script {
                    sh """
                        # Install Trivy if not present
                        if ! command -v trivy &> /dev/null; then
                            wget -qO- https://github.com/aquasecurity/trivy/releases/download/v0.45.0/trivy_0.45.0_Linux-64bit.tar.gz | tar -xz
                            sudo mv trivy /usr/local/bin/
                        fi
                        
                        # Run Trivy scan
                        trivy image --format json --output trivy-report.json ${IMAGE_NAME}:${IMAGE_TAG}
                        trivy image --format table ${IMAGE_NAME}:${IMAGE_TAG}
                        
                        # Check for HIGH and CRITICAL vulnerabilities
                        HIGH_VULNS=\$(trivy image --format json ${IMAGE_NAME}:${IMAGE_TAG} | jq '.Results[]?.Vulnerabilities[]? | select(.Severity=="HIGH" or .Severity=="CRITICAL") | .VulnerabilityID' | wc -l)
                        
                        if [ \$HIGH_VULNS -gt 0 ]; then
                            echo "⚠️  Found \$HIGH_VULNS HIGH/CRITICAL vulnerabilities!"
                            echo "🔍 Review the scan results and fix vulnerabilities before deployment."
                            # Uncomment next line to fail pipeline on high/critical vulnerabilities
                            # exit 1
                        else
                            echo "✅ No HIGH/CRITICAL vulnerabilities found!"
                        fi
                    """
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'trivy-report.json', allowEmptyArchive: true
                }
            }
        }
        
        stage('📋 Security Report Generation') {
            steps {
                echo '📋 Generating comprehensive security report...'
                script {
                    sh '''
                        # Create security report directory
                        mkdir -p security-reports
                        
                        # Generate combined security report
                        cat > security-reports/security-summary.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Security Scan Summary</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .success { background: #d4edda; border-color: #c3e6cb; }
        .warning { background: #fff3cd; border-color: #ffeaa7; }
        .error { background: #f8d7da; border-color: #f5c6cb; }
    </style>
</head>
<body>
    <div class="header">
        <h1>DevSecOps Security Report</h1>
        <p>Build #${BUILD_NUMBER} - $(date)</p>
    </div>
    
    <div class="section">
        <h2>🔍 Scan Results Summary</h2>
        <ul>
            <li>✅ Unit Tests: Passed</li>
            <li>✅ Code Quality: SonarQube Analysis Complete</li>
            <li>✅ Dependency Check: OWASP Analysis Complete</li>
            <li>✅ Container Security: Trivy Scan Complete</li>
        </ul>
    </div>
    
    <div class="section success">
        <h2>✅ Security Recommendations</h2>
        <ul>
            <li>All security scans completed successfully</li>
            <li>Review detailed reports for any findings</li>
            <li>Keep dependencies updated regularly</li>
            <li>Monitor for new vulnerabilities</li>
        </ul>
    </div>
</body>
</html>
EOF
                    '''
                }
            }
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'security-reports',
                        reportFiles: 'security-summary.html',
                        reportName: 'Security Summary Report'
                    ])
                }
            }
        }
        
        stage('🚀 Deploy to Staging') {
            when {
                branch 'main'
            }
            steps {
                echo '🚀 Deploying to staging environment...'
                script {
                    sh '''
                        # Stop existing container if running
                        docker stop todo-app-staging || true
                        docker rm todo-app-staging || true
                        
                        # Run new container
                        docker run -d \
                            --name todo-app-staging \
                            -p 3001:3000 \
                            --restart unless-stopped \
                            ${IMAGE_NAME}:${IMAGE_TAG}
                        
                        # Wait for application to start
                        sleep 10
                        
                        # Health check
                        curl -f http://localhost:3001/health || exit 1
                        
                        echo "✅ Application deployed successfully to staging!"
                    '''
                }
            }
        }
    }
    
    post {
        always {
            echo '🧹 Cleaning up workspace...'
            cleanWs()
        }
        success {
            echo '🎉 Pipeline completed successfully!'
            // Send notification to team
            emailext (
                subject: "✅ DevSecOps Pipeline SUCCESS - ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                <h2>Pipeline Execution Successful! 🎉</h2>
                <p><strong>Job:</strong> ${env.JOB_NAME}</p>
                <p><strong>Build:</strong> ${env.BUILD_NUMBER}</p>
                <p><strong>Duration:</strong> ${currentBuild.durationString}</p>
                <p><strong>Status:</strong> SUCCESS</p>
                
                <h3>Security Scans Completed:</h3>
                <ul>
                    <li>✅ Code Quality Analysis (SonarQube)</li>
                    <li>✅ Dependency Vulnerability Check (OWASP)</li>
                    <li>✅ Container Security Scan (Trivy)</li>
                </ul>
                
                <p><a href="${env.BUILD_URL}">View Build Details</a></p>
                """,
                recipientProviders: [developers(), requestor()]
            )
        }
        failure {
            echo '❌ Pipeline failed!'
            // Send failure notification
            emailext (
                subject: "❌ DevSecOps Pipeline FAILED - ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                <h2>Pipeline Execution Failed! ❌</h2>
                <p><strong>Job:</strong> ${env.JOB_NAME}</p>
                <p><strong>Build:</strong> ${env.BUILD_NUMBER}</p>
                <p><strong>Failed Stage:</strong> ${env.STAGE_NAME}</p>
                
                <p>Please check the build logs and fix the issues.</p>
                <p><a href="${env.BUILD_URL}">View Build Details</a></p>
                """,
                recipientProviders: [developers(), requestor()]
            )
        }
    }
}
