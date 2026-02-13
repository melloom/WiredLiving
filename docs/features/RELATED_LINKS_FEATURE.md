# Related Links & Backlinks Feature

This document explains the newly added Related Links & Backlinks feature for blog posts.

## Overview

The Related Links feature allows you to add connections between posts and external resources. You can create internal links (backlinks) to other posts on your blog or link to external resources to provide additional context and value to your readers.

## Features

- **Add Multiple Links**: Add as many related links as needed per post
- **Link Information**: Each link can include:
  - **Title**: Display name for the link
  - **URL**: Internal path (e.g., `/blog/getting-started`) or external URL (e.g., `https://example.com`)
  - **Description**: Optional description to provide context
- **Easy Management**: Simple UI to add, edit, and remove links
- **Persistent Storage**: Links are saved in the database as JSON

## Usage

### Creating/Editing Posts

1. Navigate to the Admin Dashboard
2. Create a new post or edit an existing one
3. Scroll to the "Related Links & Backlinks" section
4. Click "Add Link" to create a new link
5. Fill in the link details:
   - **Title**: Required - the text that will be displayed
   - **URL**: Required - where the link points to (internal or external)
   - **Description**: Optional - additional context for the link
6. Click the remove button (X) to delete unwanted links
7. Save your post as usual

### Link URL Examples

**Internal Links (Backlinks):**
- `/blog/getting-started` - Link to another post
- `/about` - Link to an about page
- `/categories` - Link to categories page

**External Links:**
- `https://example.com/article` - Link to external resource
- `https://github.com/user/repo` - Link to GitHub repo
- `https://docs.example.com` - Link to documentation

## Database Schema

The feature adds a new `related_links` column to the `posts` table:

```sql
related_links JSONB DEFAULT '[]'::jsonb
```

**Structure:**
```json
[
  {
    "title": "Getting Started Guide",
    "url": "/blog/getting-started",
    "description": "Learn how to set up your first project"
  },
  {
    "title": "Official Documentation",
    "url": "https://docs.example.com",
    "description": "Complete API reference"
  }
]
```

## Migration

To add this feature to an existing database, run the migration script:

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Run the contents of `supabase-migration-add-related-links.sql`

Alternatively, if setting up a new database, the column is already included in the main `supabase-schema.sql` file.

## TypeScript Interface

The `BlogPost` interface now includes:

```typescript
relatedLinks?: Array<{
  title: string;
  url: string;
  description?: string;
}>;
```

## API Support

Both create and update API endpoints now support the `relatedLinks` field:

**POST `/api/admin/posts`**
```json
{
  "title": "My Post",
  "content": "...",
  "relatedLinks": [
    {
      "title": "Related Article",
      "url": "/blog/related-article",
      "description": "More information here"
    }
  ]
}
```

**PUT `/api/admin/posts/[slug]`**
```json
{
  "relatedLinks": [
    {
      "title": "Updated Link",
      "url": "https://example.com"
    }
  ]
}
```

## Display in Posts

The related links are stored in the database but need to be displayed in your post template. You can add a section at the end of your blog posts to display these links, for example:

```tsx
{post.relatedLinks && post.relatedLinks.length > 0 && (
  <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-900 rounded-xl">
    <h3 className="text-xl font-bold mb-4">Related Links</h3>
    <ul className="space-y-3">
      {post.relatedLinks.map((link, idx) => (
        <li key={idx}>
          <a 
            href={link.url}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {link.title}
          </a>
          {link.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {link.description}
            </p>
          )}
        </li>
      ))}
    </ul>
  </div>
)}
```

## Benefits

- **SEO**: Internal linking improves site structure and SEO
- **User Experience**: Helps readers discover related content
- **Context**: Provides additional resources and references
- **Navigation**: Creates a web of interconnected content
- **Authority**: Links to authoritative external sources

## Best Practices

1. **Be Relevant**: Only link to content that adds value
2. **Use Descriptions**: Add context to help readers understand the link's value
3. **Mix Internal/External**: Balance internal backlinks with external resources
4. **Keep It Updated**: Remove broken links and update outdated references
5. **Don't Overdo It**: Focus on quality over quantity (3-5 links is often ideal)
