# Admin Dashboard Setup

## Default Credentials

The admin dashboard uses environment variables for authentication. By default:

- **Email**: `admin@wiredliving.com`
- **Password**: `admin123`

## Setting Up Custom Credentials

### For Local Development

Add to your `.env.local` file:

```env
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=your-secure-password
```

### For Production (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - **ADMIN_EMAIL**: Your admin email
   - **ADMIN_PASSWORD**: Your secure password
4. Redeploy your application

## Accessing the Admin Dashboard

1. Go to `/login` or press `Ctrl+L` / `Cmd+L`
2. Enter your credentials
3. You'll be redirected to `/admin`

## Features

- **Statistics Dashboard**: View total posts, published posts, drafts, and tags
- **Post Management**: View all posts with status (Published/Draft)
- **Quick Actions**: Create new posts, view blog, manage tags
- **Post Actions**: View and edit individual posts

## Security Notes

- Change default credentials in production
- Use strong passwords
- Consider implementing proper JWT tokens for production
- Session cookies expire after 7 days
- Sessions are HTTP-only and secure in production

## Next Steps

The dashboard currently shows posts from MDX files. To enable full CRUD operations:

1. Connect to your database (Vercel Postgres)
2. Implement post creation/editing forms
3. Add image upload functionality
4. Implement tag management

