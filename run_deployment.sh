#!/bin/bash
# CV Matcher - Automated Deployment Script
# Executes after Aider completes all 18 prompts

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SFTP_USER="su403214"
SFTP_PASS="deutz15!2000"
SFTP_HOST="5018735097.ssh.w2.strato.hosting"
API_URL="https://general-backend-production-a734.up.railway.app"
DEPLOY_PATH="/dabrock-info/cv-matcher"

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
WARNINGS=0

# Log file
LOG_FILE="deployment-$(date +%Y%m%d-%H%M%S).log"

log() {
    echo -e "${1}" | tee -a "$LOG_FILE"
}

success() {
    ((TESTS_PASSED++))
    log "${GREEN}✅ ${1}${NC}"
}

error() {
    ((TESTS_FAILED++))
    log "${RED}❌ ${1}${NC}"
}

warning() {
    ((WARNINGS++))
    log "${YELLOW}⚠️  ${1}${NC}"
}

info() {
    log "${BLUE}ℹ️  ${1}${NC}"
}

section() {
    log "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${BLUE}  ${1}${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# ============================================================================
# Phase 1: Pre-Deployment Tests
# ============================================================================

section "Phase 1: Pre-Deployment Tests"

# Test 1: Check if Aider is done
info "Checking Aider completion status..."
if [ -d "/mnt/e/CodelocalLLM/CV_Matcher/src" ]; then
    success "Source directory exists"
else
    error "Source directory not found - Aider may not be complete"
    exit 1
fi

# Test 2: Check package.json
info "Checking package.json..."
if [ -f "package.json" ]; then
    success "package.json found"
else
    error "package.json not found"
    exit 1
fi

# Test 3: Check environment
info "Checking .env file..."
if [ -f ".env" ]; then
    success ".env file exists"
    if grep -q "VITE_API_URL.*railway.app" .env; then
        success "VITE_API_URL configured correctly"
    else
        warning ".env may not have correct API URL"
    fi
else
    warning ".env file not found - will use defaults"
fi

# Test 4: Build test
section "Phase 2: Build & Quality Tests"

info "Running build test..."
if npm run build >> "$LOG_FILE" 2>&1; then
    success "Build successful"

    # Check dist folder
    if [ -d "dist" ]; then
        FILE_COUNT=$(find dist -type f | wc -l)
        DIST_SIZE=$(du -sh dist | cut -f1)
        success "Build artifacts: $FILE_COUNT files, $DIST_SIZE total"
    else
        error "dist/ folder not created"
        exit 1
    fi
else
    error "Build failed - check $LOG_FILE"
    exit 1
fi

# Test 5: ESLint (optional, non-blocking)
info "Running ESLint checks..."
if npx eslint src --ext .js,.jsx,.ts,.tsx --max-warnings 20 >> "$LOG_FILE" 2>&1; then
    success "ESLint passed"
else
    warning "ESLint warnings found (non-critical)"
fi

# Test 6: API connectivity
info "Testing backend connectivity..."
if curl -s "$API_URL/health" | grep -q "healthy"; then
    success "Backend is healthy"
else
    error "Backend not responding"
    exit 1
fi

# ============================================================================
# Phase 3: Deployment
# ============================================================================

section "Phase 3: Deployment to Strato"

# Create .htaccess
info "Creating .htaccess for SPA routing..."
cat > dist/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /cv-matcher/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /cv-matcher/index.html [L]
</IfModule>
EOF
success ".htaccess created"

# Upload files
cd dist

info "Uploading files to Strato..."
UPLOADED=0
FAILED=0

# Upload main files
for file in index.html .htaccess; do
    if [ -f "$file" ]; then
        info "Uploading $file..."
        if curl -T "$file" \
            "sftp://$SFTP_HOST$DEPLOY_PATH/$file" \
            --user "$SFTP_USER:$SFTP_PASS" \
            --ftp-create-dirs \
            -k \
            --connect-timeout 30 \
            --max-time 120 \
            --silent; then
            ((UPLOADED++))
        else
            ((FAILED++))
            error "Failed to upload $file"
        fi
    fi
done

# Upload assets
if [ -d "assets" ]; then
    for file in assets/*; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            info "Uploading assets/$filename..."
            if curl -T "$file" \
                "sftp://$SFTP_HOST$DEPLOY_PATH/assets/$filename" \
                --user "$SFTP_USER:$SFTP_PASS" \
                --ftp-create-dirs \
                -k \
                --connect-timeout 30 \
                --max-time 120 \
                --silent; then
                ((UPLOADED++))
            else
                ((FAILED++))
                warning "Failed to upload $filename"
            fi
        fi
    done
fi

cd ..

if [ $FAILED -eq 0 ]; then
    success "All files uploaded ($UPLOADED files)"
else
    warning "$FAILED files failed to upload (but $UPLOADED succeeded)"
fi

# ============================================================================
# Phase 4: Post-Deployment Validation
# ============================================================================

section "Phase 4: Post-Deployment Validation"

# Wait for deployment to propagate
info "Waiting 5 seconds for deployment to propagate..."
sleep 5

# Test 1: Landing page
info "Testing landing page..."
if curl -s "https://www.dabrock.info/cv-matcher/" | grep -iq "cv"; then
    success "Landing page is accessible"
else
    warning "Landing page may not be fully loaded yet"
fi

# Test 2: Check assets
info "Checking if assets load..."
RESPONSE=$(curl -I "https://www.dabrock.info/cv-matcher/" 2>&1)
if echo "$RESPONSE" | grep -q "200"; then
    success "HTTP 200 response received"
else
    warning "Unexpected HTTP response"
fi

# ============================================================================
# Summary
# ============================================================================

section "Deployment Summary"

log "${GREEN}📊 Test Results:${NC}"
log "   ✅ Passed: $TESTS_PASSED"
log "   ❌ Failed: $TESTS_FAILED"
log "   ⚠️  Warnings: $WARNINGS"

log "\n${GREEN}📦 Deployment:${NC}"
log "   📁 Files uploaded: $UPLOADED"
log "   ❌ Failed uploads: $FAILED"

log "\n${BLUE}🌐 URLs:${NC}"
log "   • Landing Page: https://www.dabrock.info/"
log "   • CV Matcher: https://www.dabrock.info/cv-matcher/"
log "   • Admin Panel: https://www.dabrock.info/admin/"
log "   • Backend API: $API_URL"

log "\n${BLUE}📝 Log File:${NC}"
log "   $LOG_FILE"

if [ $TESTS_FAILED -eq 0 ] && [ $FAILED -eq 0 ]; then
    log "\n${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    log "${GREEN}║                                                               ║${NC}"
    log "${GREEN}║   ✅ DEPLOYMENT SUCCESSFUL!                                   ║${NC}"
    log "${GREEN}║                                                               ║${NC}"
    log "${GREEN}║   CV Matcher is now live at:                                 ║${NC}"
    log "${GREEN}║   https://www.dabrock.info/cv-matcher/                       ║${NC}"
    log "${GREEN}║                                                               ║${NC}"
    log "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    log "\n${YELLOW}╔═══════════════════════════════════════════════════════════════╗${NC}"
    log "${YELLOW}║                                                               ║${NC}"
    log "${YELLOW}║   ⚠️  DEPLOYMENT COMPLETED WITH WARNINGS                      ║${NC}"
    log "${YELLOW}║                                                               ║${NC}"
    log "${YELLOW}║   Please review the log file for details.                   ║${NC}"
    log "${YELLOW}║                                                               ║${NC}"
    log "${YELLOW}╚═══════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
