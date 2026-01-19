# Production Environment Setup

## Required Environment Variables

The following environment variables **MUST** be configured in your production environment for the application to work correctly:

### Supabase Configuration (REQUIRED)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (public)

### Optional Variables
- `AUTH_SECRET` - NextAuth secret key (only needed if using NextAuth - **NOT required for pure Supabase Auth**)
- `NEXTAUTH_URL` - URL of your deployed application (only needed if using NextAuth)
- `UPSTASH_REDIS_REST_URL` - Redis URL for rate limiting
- `UPSTASH_REDIS_REST_TOKEN` - Redis token for rate limiting
- `ADMIN_EMAILS` - Comma-separated list of admin email addresses
- `NEWS_API_KEY` - News API key for news feed feature

## Authentication Method

This application uses **Supabase Auth directly** (not NextAuth). Users are authenticated through Supabase's authentication system.

### Setting Up Authentication

1. Go to your Supabase project
2. Navigate to **Authentication** → **Users**
3. Create admin users directly in Supabase
4. Users log in with their Supabase credentials at `/login`

### Obtaining Supabase Credentials

1. Go to your Supabase project settings
2. Navigate to **API** section
3. Find the following keys:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Public Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

⚠️ **Note**: You do NOT need the Service Role Key for authentication anymore!

### Deployment Platforms

#### Vercel
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add each environment variable with the appropriate scope (Production, Preview, Development)
4. Set `SERVICE_ROLE_KEY` and `AUTH_SECRET` as sensitive/secret variables

#### AWS Lambda / AWS Amplify
1. Store in **AWS Secrets Manager** for `SERVICE_ROLE_KEY`
2. Use environment variables for public keys
3. Ensure IAM roles have proper permissions

#### Other Platforms
1. Use the platform's secrets management system for `SERVICE_ROLE_KEY`
2. Use standard environment variables for public keys
3. Never store secrets in configuration files

## Verification

After deploying with all environment variables set, verify the setup:

1. **Authentication Test**: Try logging in at `/login`
2. **API Health**: Check `/api/health` endpoint (if available)
3. **Admin Access**: Verify admin dashboard works at `/admin`
4. **Database Connection**: Try creating/viewing content

## Troubleshooting

### "Supabase credentials are not configured"
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `SERVICE_ROLE_KEY` are set
- Check that values don't have extra spaces or quotes
- Ensure values are not the placeholder text

### "Unauthorized" errors
- Verify `AUTH_SECRET` is set (minimum 32 characters)
- Check `NEXTAUTH_URL` matches your deployment URL
- Ensure cookies are not being blocked (check browser security settings)

### Authentication fails
- Verify Supabase project is active and accessible
- Check that the user account exists in Supabase
- Verify Supabase auth is properly configured

## Security Checklist

- [ ] `AUTH_SECRET` is at least 32 characters and cryptographically secure
- [ ] `SERVICE_ROLE_KEY` is never committed to git
- [ ] `SERVICE_ROLE_KEY` is only used server-side
- [ ] All public keys (`NEXT_PUBLIC_*`) are explicitly marked as public
- [ ] Environment variables are set in production environment, not in code
- [ ] HTTPS is enabled (required for production)
- [ ] NEXTAUTH_URL matches your deployment domain
- [ ] Supabase project is configured for your domain (CORS, etc.)
