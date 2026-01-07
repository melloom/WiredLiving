# Blog

A modern, performant blog built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) - React framework with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **Content**: [MDX](https://mdxjs.com/) - Markdown with JSX support
- **Code Highlighting**: [Shiki](https://shiki.matsu.io/) or [Prism](https://prismjs.com/) - Syntax highlighting
- **Deployment**: [Vercel](https://vercel.com/) (recommended) or [Netlify](https://www.netlify.com/)

## 📁 Project Structure

```
blog/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── blog/              # Blog routes
│   │   ├── [slug]/        # Dynamic blog post pages
│   │   └── page.tsx       # Blog listing page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   └── blog/              # Blog-specific components
├── content/               # Blog posts (MDX files)
│   └── posts/
├── lib/                   # Utility functions
│   ├── mdx.ts            # MDX processing
│   └── utils.ts          # Helper functions
├── public/                # Static assets
│   └── images/
├── types/                 # TypeScript type definitions
└── config/                # Configuration files
    └── site.ts            # Site metadata
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Git

### Installation

1. Clone the repository (or navigate to the project directory)
2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📝 Writing Blog Posts

Blog posts are written in MDX format and stored in the `content/posts/` directory.

### Post Frontmatter

Each post should include frontmatter with the following fields:

```yaml
---
title: "Your Post Title"
description: "A brief description of your post"
date: "2024-01-01"
author: "Your Name"
tags: ["tag1", "tag2"]
published: true
---
```

### Example Post

Create a file `content/posts/my-first-post.mdx`:

```mdx
---
title: "My First Blog Post"
description: "This is my first blog post"
date: "2024-01-01"
author: "Your Name"
tags: ["introduction", "getting-started"]
published: true
---

# My First Blog Post

This is the content of my first blog post. You can use **markdown** syntax and even React components!

<CustomComponent prop="value" />
```

## 🎨 Customization

### Site Configuration

Edit `config/site.ts` to customize:
- Site name and description
- Author information
- Social media links
- Theme colors

### Styling

- Global styles: `app/globals.css`
- Tailwind config: `tailwind.config.ts`
- Component styles: Use Tailwind classes or CSS modules

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Vercel will automatically detect Next.js and deploy

Or use the Vercel CLI:

```bash
npm i -g vercel
vercel
```

### Deploy to Netlify

1. Build the project: `npm run build`
2. Deploy using Netlify CLI:

```bash
npm i -g netlify-cli
netlify deploy --prod
```

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🧩 Features

- ✅ Modern Next.js 14 with App Router
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ MDX support for rich content
- ✅ Syntax highlighting for code blocks
- ✅ SEO optimized
- ✅ Responsive design
- ✅ Dark mode support (optional)
- ✅ RSS feed (optional)
- ✅ Search functionality (optional)

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [MDX Documentation](https://mdxjs.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

