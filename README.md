# WiredLiving Blog

A modern, feature-rich blog platform built with Next.js 14, TypeScript, Supabase, and Tailwind CSS.

🌐 **Live Site**: [wiredliving.blog](https://wiredliving.blog)

## ✨ Features

- 🚀 **Modern Stack**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- 📝 **Rich Content Management**: Full-featured admin dashboard for creating and managing posts
- ✍️ **Advanced Markdown Editor**: Enhanced toolbar with auto-format, footnotes, collapsibles, keyboard keys, and more
- 🔍 **Search Functionality**: Full-text search across all posts
- 🏷️ **Tags & Categories**: Organize content with tags and categories
- 📊 **Analytics**: Built-in analytics tracking for page views and visitor insights
- 📧 **Newsletter**: Email subscription system
- 🔐 **Admin Dashboard**: Secure admin panel with authentication
- 📱 **Responsive Design**: Mobile-first, fully responsive design
- 🌙 **Dark Mode**: Built-in dark mode support
- 🔗 **SEO Optimized**: Meta tags, sitemap, RSS feed, and structured data
- 📸 **Image Management**: Upload and manage images with Supabase Storage
- ⚡ **Fast Performance**: Optimized for speed and performance
- 🎨 **Beautiful UI**: Modern, clean interface with smooth animations

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Storage**: Supabase Storage for images
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Deployment**: [Vercel](https://vercel.com/)

## 📁 Project Structure

```
blog/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard
│   ├── api/                # API routes
│   ├── blog/              # Blog pages
│   ├── search/            # Search page
│   ├── tags/               # Tags page
│   ├── archive/            # Archive page
│   ├── about/              # About page
│   ├── contact/            # Contact page
│   ├── faq/                # FAQ page
│   ├── newsletter/         # Newsletter page
│   ├── resources/          # Resources page
│   └── ...
├── components/             # React components
│   ├── admin-dashboard.tsx # Admin panel
│   ├── header.tsx          # Site header
│   ├── footer.tsx          # Site footer
│   └── ...
├── lib/                    # Utility functions
│   ├── supabase-db.ts      # Database operations
│   ├── supabase-storage.ts # Storage operations
│   ├── supabase-analytics.ts # Analytics
│   └── ...
├── config/                 # Configuration
│   └── site.ts             # Site metadata
├── types/                  # TypeScript types
└── public/                 # Static assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A Supabase account (free tier works)
- Git

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd blog
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth
AUTH_SECRET=your_auth_secret_generate_with_openssl_rand_base64_32
AUTH_URL=http://localhost:3000

# Admin Credentials
ADMIN_EMAIL=your_admin_email@example.com
ADMIN_PASSWORD=your_secure_password
```

4. **Set up Supabase**

Follow the instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to:
- Create your Supabase project
- Set up the database schema
- Create the storage bucket
- Configure security policies

5. **Run the development server**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

6. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## 📚 Documentation

- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Complete Supabase setup guide
- **[SUPABASE_SECURITY.md](./SUPABASE_SECURITY.md)** - Security configuration and best practices
- **[ANALYTICS_SETUP.md](./ANALYTICS_SETUP.md)** - Analytics setup and configuration
- **[ADMIN_SETUP.md](./ADMIN_SETUP.md)** - Admin dashboard setup
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment instructions
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions

## 🎯 Key Features Explained

### Admin Dashboard

Access the admin dashboard at `/admin` (requires login). Features include:

- Create, edit, and delete posts
- Manage tags
- Upload images
- View analytics
- Schedule posts
- Set post visibility (public/unlisted/private)
- Mark posts as featured

### Search

Full-text search available at `/search`. Search by:
- Post title
- Content
- Tags
- Author

### Analytics

Built-in analytics tracking:
- Page views
- Unique visitors
- Top posts
- Device types
- Referrers
- Daily statistics

### SEO Features

- Automatic sitemap generation (`/sitemap.xml`)
- RSS feed (`/feed.xml`)
- Meta tags and Open Graph
- Structured data (JSON-LD)
- Robots.txt

## 📝 Writing Posts

Posts are created through the admin dashboard with an advanced markdown editor featuring:

### Markdown Features
- **Smart Auto-Format**: AI-powered content analyzer that:
  - Detects and structures headings (H1-H6) from plain text
  - Identifies section types and optimizes hierarchy
  - Converts various bullet styles to markdown
  - Formats lists, tables, callouts, and quotes automatically
  - Cleans up spacing, links, and formatting issues
  - Preserves code blocks and special elements
- **Rich Formatting**: Bold, italic, strikethrough, inline code, code blocks
- **Headings**: H1-H6 with intelligent auto-detection
- **Lists**: Unordered, ordered, and task lists (checklists) with auto-conversion
- **Links & Images**: Internal/external links with auto-wrapping, image galleries
- **Tables**: Full GFM table support with auto-alignment
- **Blockquotes**: Simple and nested quotes with color-coded callouts
- **Advanced Features**:
  - 📌 Footnotes with references
  - 📖 Definition lists
  - ⌨️ Keyboard key styling (e.g., `Cmd` + `K`)
  - 💬 Nested blockquotes
  - 📂 Collapsible sections (`<details>`)
  - 📋 Table of Contents with anchor links
  - 📊 Progress trackers
  - 📸 Snapshot tables

### Post Options
- Cover images
- Gallery images
- Tags and categories
- SEO metadata (title, description, OG image)
- Custom slugs
- Scheduled publishing
- Visibility settings (public/unlisted/private)
- Related links

### Markdown Resources
- 📖 **[Complete Markdown Guide](MARKDOWN_GUIDE.md)** - Full syntax reference with examples
- 🎯 **[Toolbar Quick Reference](MARKDOWN_TOOLBAR_REFERENCE.md)** - Quick button guide
- 📋 **[Features Summary](MARKDOWN_FEATURES_SUMMARY.md)** - What's available

## 🎨 Customization

### Site Configuration

Edit `config/site.ts` to customize:
- Site name and description
- Author information
- Social media links
- Site URL

### Styling

- Global styles: `app/globals.css`
- Tailwind config: `tailwind.config.ts`
- Components: Use Tailwind utility classes

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

Or use the Vercel CLI:

```bash
npm i -g vercel
vercel
```

### Environment Variables for Production

Make sure to set all environment variables in your deployment platform:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SERVICE_ROLE_KEY`
- `AUTH_SECRET`
- `AUTH_URL` (your production URL)
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

**Optional (for enhanced features):**
- `NEWS_API_KEY` - For related news feed in sidebar (see [SETUP_NEWS_API.md](./docs/setup/SETUP_NEWS_API.md))
- `NEXT_PUBLIC_WEATHER_API_KEY` - For weather widget in sidebar (see [SETUP_WEATHER_API.md](./docs/setup/SETUP_WEATHER_API.md))

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🔒 Security

- Row Level Security (RLS) enabled on all Supabase tables
- Secure authentication with NextAuth.js
- Service role key only used server-side
- Environment variables never exposed to client
- Admin routes protected

See [SUPABASE_SECURITY.md](./SUPABASE_SECURITY.md) for detailed security information.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](./LICENSE).

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database powered by [Supabase](https://supabase.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons and UI inspiration from various open-source projects

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Contact: contact@mellowsites.com
- Visit: [mellowsites.com](https://www.mellowsites.com)

---

**Made with ❤️ by [Melvin](https://www.mellowsites.com)**
