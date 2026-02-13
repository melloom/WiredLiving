#!/bin/bash

# Security & Monitoring Setup Script
# This script sets up the security and monitoring infrastructure

set -e

echo "🔐 Setting up Security & Monitoring Infrastructure..."
echo ""

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs
chmod 755 logs
echo "✅ Logs directory created"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "⚠️  Warning: .env.local not found"
  echo "Creating .env.local template..."
  cat > .env.local << 'EOF'
# Node Environment
NODE_ENV=development

# NextAuth
AUTH_SECRET=your-secret-key-change-me-minimum-32-characters
NEXTAUTH_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SERVICE_ROLE_KEY=your-service-role-key

# Admin Emails (comma-separated)
ADMIN_EMAILS=admin@example.com

# Optional: Upstash Redis (for rate limiting)
# UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
# UPSTASH_REDIS_REST_TOKEN=your-token

# Optional: Email Service
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=your-email@example.com
# SMTP_PASSWORD=your-password
# SMTP_FROM=noreply@example.com

# Optional: Analytics
# GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
# PLAUSIBLE_DOMAIN=yourdomain.com
EOF
  echo "✅ .env.local template created - PLEASE UPDATE WITH YOUR VALUES"
  echo ""
fi

# Check Node.js version
echo "🔍 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js version 18 or higher is required"
  echo "   Current version: $(node -v)"
  exit 1
fi
echo "✅ Node.js version OK: $(node -v)"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo "✅ Dependencies installed"
  echo ""
fi

# Check if security dependencies are installed
echo "🔍 Checking security dependencies..."
DEPS_MISSING=0

if ! npm list zod &>/dev/null; then
  echo "❌ Zod not installed"
  DEPS_MISSING=1
fi

if ! npm list winston &>/dev/null; then
  echo "❌ Winston not installed"
  DEPS_MISSING=1
fi

if [ $DEPS_MISSING -eq 1 ]; then
  echo ""
  echo "Installing missing dependencies..."
  npm install zod winston helmet
  echo "✅ Dependencies installed"
fi
echo "✅ All security dependencies present"
echo ""

# Database setup instructions
echo "🗄️  Database Setup"
echo "─────────────────────────────────────────────────────"
echo "To set up security tables in Supabase:"
echo ""
echo "1. Go to your Supabase project"
echo "2. Open the SQL Editor"
echo "3. Run the SQL script: supabase-security-schema.sql"
echo ""
echo "Or use this command to copy the SQL:"
echo "  cat supabase-security-schema.sql | pbcopy  # macOS"
echo "  cat supabase-security-schema.sql | xclip -selection clipboard  # Linux"
echo ""

# Summary
echo "📋 Setup Summary"
echo "─────────────────────────────────────────────────────"
echo "✅ Logs directory created"
echo "✅ Environment template created (if needed)"
echo "✅ Dependencies verified"
echo ""
echo "📚 Next Steps:"
echo "1. Update .env.local with your actual credentials"
echo "2. Run the SQL script in Supabase (supabase-security-schema.sql)"
echo "3. Review SECURITY_GUIDE.md for usage instructions"
echo "4. Start the dev server: npm run dev"
echo ""
echo "🎉 Security & Monitoring setup complete!"
echo ""
echo "📖 Documentation:"
echo "   - Security Guide: SECURITY_GUIDE.md"
echo "   - Database Schema: supabase-security-schema.sql"
echo ""
