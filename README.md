# DevSecOps CI/CD Pipeline - Todo Application

A comprehensive DevSecOps implementation featuring automated security scanning, code quality analysis, and containerized deployment for a Node.js todo application.

## 🚀 Features

### Security-First Approach
- **OWASP Dependency Check** - Vulnerability scanning for dependencies
- **Trivy Container Security** - Docker image vulnerability assessment
- **SonarQube Integration** - Code quality and security analysis
- **Automated Quality Gates** - Pipeline fails on security/quality issues

### CI/CD Pipeline
- **Automated Testing** - Unit tests with coverage reporting
- **Multi-stage Security Scanning** - Comprehensive security analysis
- **Docker Integration** - Containerized application deployment
- **Staging Deployment** - Automated deployment to staging environment
- **Email Notifications** - Success/failure notifications to team

## 🏗️ Architecture

```
todo-app/
├── src/                          # Application source code
│   ├── app.js                    # Main application file
│   ├── routes/                   # API routes
│   │   └── todos.js             # Todo endpoints
│   └── views/                   # Frontend templates
│       └── index.html           # Main UI
├── tests/                       # Test files
│   └── app.test.js              # Unit tests
├── coverage/                    # Test coverage reports
├── security-reports/            # Security scan results
├── Dockerfile                   # Container configuration
├── docker-compose.yml           # Multi-container setup
├── Jenkinsfile                  # CI/CD pipeline definition
├── sonar-project.properties     # SonarQube configuration
├── owasp-suppressions.xml       # OWASP suppressions
├── package.json                 # Node.js dependencies
└── README.md                    # This file
```

## 🔧 Prerequisites

### Jenkins Setup
- Jenkins 2.400+ with Blue Ocean plugin
- Docker installed on Jenkins agent
- Node.js 18+ configured as global tool
- Required Jenkins plugins:
  - Pipeline
  - Docker Pipeline
  - SonarQube Scanner
  - HTML Publisher
  - Email Extension
  - OWASP Dependency Check (optional)

### External Services
- **SonarQube Server** - Running on `http://localhost:9000`
- **Docker Registry** - Configure `DOCKER_REGISTRY` in pipeline
- **Email SMTP** - For pipeline notifications

### Security Tools
- **Trivy** - Container security scanner
- **OWASP Dependency Check** - Dependency vulnerability scanner
- **NPM Audit** - Fallback dependency scanner

## 🛠️ Installation & Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd todo-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Jenkins Pipeline

#### Environment Variables
Update the following in `Jenkinsfile`:
```groovy
environment {
    DOCKER_REGISTRY = 'your-registry.com'  // Your Docker registry
    IMAGE_NAME = 'todo-app'
    SONAR_HOST_URL = 'http://localhost:9000'  // SonarQube server
}
```

#### Jenkins Credentials
Create the following credentials in Jenkins:
- `sonar-token` - SonarQube authentication token

### 4. SonarQube Configuration
Create `sonar-project.properties`:
```properties
sonar.projectKey=todo-app
sonar.projectName=Todo Application
sonar.projectVersion=1.0
sonar.sources=src
sonar.tests=tests
sonar.javascript.lcov.reportPaths=coverage/lcov.info
```

### 5. Docker Configuration
Ensure `Dockerfile` is present in project root:
```dockerfile
# Multi-stage build for security aur size optimization
FROM node:18-alpine AS builder

# Security: non-root user create karte hain
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

WORKDIR /app

# Copy package files first (Docker layer caching ke liye)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY --chown=nodeuser:nodejs . .

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

WORKDIR /app

# Copy from builder stage
COPY --from=builder --chown=nodeuser:nodejs /app .

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/app.js"]
```

## 🔄 Pipeline Stages

### 1. 📥 Checkout
- Pulls latest code from repository
- Initializes workspace

### 2. 📦 Install Dependencies
- Runs `npm ci` for clean dependency installation
- Ensures reproducible builds

### 3. 🧪 Unit Tests
- Executes test suite with coverage
- Generates HTML coverage reports
- Archives test artifacts
- **Fails pipeline** if tests don't pass

### 4. 📊 Code Quality Analysis
- Runs SonarQube static analysis
- Scans for code smells, bugs, vulnerabilities
- Analyzes test coverage metrics

### 5. 🔍 Quality Gate
- Waits for SonarQube quality gate results
- **Fails pipeline** if quality standards not met
- 5-minute timeout for analysis

### 6. 🔒 Dependency Vulnerability Check
- **Primary**: OWASP Dependency Check plugin
- **Fallback**: NPM audit for vulnerability scanning
- Generates comprehensive security reports
- Highlights HIGH/CRITICAL vulnerabilities

### 7. 🐳 Build Docker Image
- Builds containerized application
- Tags with build number
- Prepares for deployment

### 8. 🛡️ Container Security Scan
- Runs Trivy security scanner on Docker image
- Identifies vulnerabilities in base image and dependencies
- Generates detailed security reports
- **Optional**: Can fail pipeline on HIGH/CRITICAL findings

### 9. 📋 Security Report Generation
- Consolidates all security scan results
- Creates comprehensive security summary
- Provides recommendations and next steps

### 10. 🚀 Deploy to Staging
- **Conditional**: Only runs on `main` branch
- Deploys containerized application to staging
- Performs health checks
- Exposes application on port 3001

## 📊 Reports & Artifacts

### Generated Reports
- **Test Coverage Report** - HTML coverage analysis
- **SonarQube Analysis** - Code quality metrics
- **OWASP/NPM Audit Report** - Dependency vulnerabilities
- **Trivy Security Report** - Container security scan
- **Security Summary Report** - Consolidated security overview

### Archived Artifacts
- Test coverage data
- Security scan results
- Dependency check reports
- Build logs and metadata

## 📧 Notifications

### Success Notifications
- ✅ Pipeline completion confirmation
- 📊 Security scan summary
- 🔗 Links to build details and reports

### Failure Notifications
- ❌ Pipeline failure alerts
- 🎯 Failed stage identification
- 🔧 Links to build logs for debugging

## 🔧 Configuration

### Email Recipients
Update notification recipients in `Jenkinsfile`:
```groovy
to: 'ajeetkrup401@gmail.com'
// cc: 'team@company.com'
// bcc: 'manager@company.com'
```

### Security Thresholds
Customize security failure conditions:
```bash
# Fail on HIGH/CRITICAL vulnerabilities
if [ $HIGH_VULNS -gt 0 ]; then
    exit 1  # Uncomment to fail pipeline
fi
```

### Tool Versions
- Node.js: 18+
- OWASP Dependency Check: 8.4.0
- Trivy: Latest available
- SonarQube: Compatible with scanner

## 🚀 Usage

### Running the Pipeline
1. **Commit code** to repository
2. **Jenkins automatically triggers** pipeline
3. **Monitor progress** through Jenkins Blue Ocean
4. **Review reports** generated in each stage
5. **Address any security/quality issues** found

### Local Development
```bash
# Install dependencies
npm install

# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Start application
npm start
```

### Manual Security Scans
```bash
# Run NPM audit
npm audit

# Run Trivy scan (if installed)
trivy image todo-app:latest

# Run OWASP check (if installed)
dependency-check --scan . --format HTML
```

## 🔒 Security Best Practices

### Implemented Security Measures
- **Dependency Scanning** - Regular vulnerability checks
- **Container Security** - Base image and layer scanning
- **Code Quality Gates** - Automated quality enforcement
- **Secure Pipeline** - Credential management and secrets handling

### Recommendations
- **Regular Updates** - Keep dependencies and base images current
- **Vulnerability Monitoring** - Set up alerts for new vulnerabilities
- **Security Training** - Ensure team understands security practices
- **Incident Response** - Have plan for security findings

## 🐛 Troubleshooting

### Common Issues

#### Trivy Not Found
```bash
# Install Trivy on Jenkins agent
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
```

#### SonarQube Connection Issues
- Verify `SONAR_HOST_URL` is accessible
- Check `sonar-token` credential is valid
- Ensure SonarQube server is running

#### Docker Build Failures
- Check Dockerfile syntax
- Verify base image availability
- Ensure sufficient disk space

#### Test Failures
- Review test logs in Jenkins
- Check test coverage requirements
- Verify test environment setup

## 📈 Monitoring & Metrics

### Pipeline Metrics
- **Build Success Rate** - Track pipeline reliability
- **Security Scan Results** - Monitor vulnerability trends
- **Code Quality Metrics** - Track technical debt
- **Deployment Frequency** - Measure delivery cadence

### Security Metrics
- **Vulnerability Count** - Track security findings
- **Resolution Time** - Monitor fix duration
- **False Positive Rate** - Optimize scanning accuracy
- **Compliance Status** - Ensure regulatory adherence

## 🤝 Contributing

### Development Workflow
1. **Fork repository** and create feature branch
2. **Implement changes** following coding standards
3. **Add/update tests** for new functionality
4. **Run security scans** locally before committing
5. **Submit pull request** with detailed description

### Pipeline Enhancements
- Add integration tests
- Implement performance testing
- Add deployment to production
- Enhance security scanning coverage

## 📚 References

- [Jenkins Pipeline Documentation](https://jenkins.io/doc/book/pipeline/)
- [SonarQube Integration](https://docs.sonarqube.org/latest/analysis/jenkins/)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)
- [Trivy Security Scanner](https://github.com/aquasecurity/trivy)
- [DevSecOps Best Practices](https://owasp.org/www-project-devsecops-guideline/)

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support

For issues and questions:
- 📧 Email: ajeetkrup401@gmail.com
- 🐛 Issues: Create GitHub issue
- 📖 Documentation: Check Jenkins and tool documentation

---

**Built with ❤️ by Ajeet Kumar Upadhyay**