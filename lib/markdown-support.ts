/**
 * Wired Living - Markdown Support Reference
 * ----------------------------------------
 * This file documents the Markdown features supported in your blog editor + renderer.
 *
 * Rendering stack:
 * - MDXContent component
 * - react-markdown
 * - remark-gfm (GitHub Flavored Markdown)
 * - remark-footnotes (Footnotes)
 * - remark-math + rehype-katex (Math/KaTeX)
 * - remark-smartypants (Smart typography)
 *
 * Link behavior:
 * - Internal links like `/blog/slug` render as Next.js <Link>
 * - External links open in a new tab
 *
 * Use this file for:
 * - Documentation in-repo
 * - Tooltips/help panels in the editor
 * - Validating content patterns (callouts, captions, etc.)
 */

export const WIREDLIVING_MARKDOWN_SUPPORT = {
  project: {
    site: "https://wiredliving.blog",
    renderer: ["react-markdown", "remark-gfm"],
    notes: [
      "Standard Markdown + GitHub Flavored Markdown (GFM) are supported.",
      "Footnotes, inline/block math (KaTeX), and smart quotes/dashes are enabled.",
      "Syntax highlighting is enabled for fenced code blocks (via rehype-highlight).",
      "Internal links render as Next.js Link; external links open in a new tab.",
      "MarkdownToolbar can insert/auto-format common blocks (headings, code, images, tables, checklists, callouts).",
    ],
  },

  toolbar: {
    supports: [
      "Headings (H1, H2, H3)",
      "Bold, italic",
      "Inline code, code blocks (highlighted)",
      "Links, images, GIFs",
      "Videos (HTML5 video tag)",
      "YouTube/Vimeo embeds (iframe)",
      "Blockquotes, dividers",
      "Tables, checklists",
      "Callouts (info, warning, success, error)",
      "Auto-Format (structure + spacing)",
      "Gallery image insertion (Markdown image links)",
    ],
  },

  syntax: {
    headings: {
      description: "Use #, ##, ### for headings.",
      examples: ["# Title", "## Section", "### Subsection"],
    },

    emphasis: {
      description: "Bold/italic/strikethrough.",
      examples: ["**bold**", "*italic*", "~~strikethrough~~"],
      notes: ["Strikethrough is a GFM feature."],
    },

    inlineCode: {
      description: "Inline code uses single backticks.",
      examples: ["Use `npm run dev` to start.", "Press `Cmd` + `K` to search."],
    },

    codeBlocks: {
      description: "Triple backticks for fenced code blocks (optionally add language).",
      examples: [
        "```js\nconsole.log('hello')\n```",
        "```bash\nnpm i\nnpm run dev\n```",
      ],
    },

    links: {
      description: "Standard Markdown links.",
      examples: [
        "[Wired Living](https://wiredliving.blog)",
        "[Internal post](/blog/first-post-no-filter)",
      ],
      notes: [
        "Internal links (starting with /) become Next.js Link components.",
        "External links open in a new tab.",
      ],
    },

    images: {
      description: "Standard Markdown images.",
      examples: [
        "![Alt text](/images/covers/first-post-no-filter.png)",
        "![Alt text](https://example.com/image.png)",
      ],
      recommendedPatterns: {
        caption: {
          description:
            "Caption pattern: use an italic line immediately after an image (easy to style in CSS).",
          example:
            "![Alt text](/images/covers/first-post-no-filter.png)\n*Caption goes here*",
        },
        galleryHint: {
          description:
            "Gallery: insert multiple image lines. (If you add grouping logic, detect consecutive images.)",
          example:
            "![Gallery](/images/gallery/1.png)\n![Gallery](/images/gallery/2.png)\n![Gallery](/images/gallery/3.png)",
        },
      },
    },

    lists: {
      description: "Ordered and unordered lists.",
      examples: [
        "- item\n- item\n  - nested item",
        "1. first\n2. second",
      ],
    },

    checklists: {
      description: "Task lists are supported via GFM.",
      examples: ["- [ ] todo", "- [x] done"],
    },

    blockquotes: {
      description: "Blockquotes use >. Can be nested.",
      examples: [
        "> Quote here",
        "> Main quote\n>\n> > Nested quote",
      ],
    },

    dividers: {
      description: "Horizontal rule / divider.",
      examples: ["---"],
    },

    tables: {
      description: "Tables are supported via GFM.",
      examples: [
        "| Header | Header |\n|--------|--------|\n| Cell   | Cell   |",
      ],
    },

    autolinks: {
      description:
        "Plain URLs may render as links (common with GFM + markdown renderers).",
      examples: ["https://wiredliving.blog"],
    },
  },

  callouts: {
    description:
      "Callouts are written as blockquotes with emoji + bold label. Keep them short (1–3 lines).",
    types: {
      info: {
        label: "Info",
        emoji: "ℹ️",
        example: "> ℹ️ **Info**\n> Content here",
      },
      warning: {
        label: "Warning",
        emoji: "⚠️",
        example: "> ⚠️ **Warning**\n> Content here",
      },
      success: {
        label: "Success",
        emoji: "✅",
        example: "> ✅ **Success**\n> Content here",
      },
      error: {
        label: "Error",
        emoji: "❌",
        example: "> ❌ **Error**\n> Content here",
      },
    },
    rules: [
      "Max 1–2 callouts per section. Too many makes posts feel noisy.",
      "Use one idea per callout. No walls of text.",
    ],
  },

  formattingRules: [
    "Use short paragraphs (2–4 lines) for readability.",
    "Use H2 sections (##) to make posts scannable.",
    "Avoid huge blocks of text; add dividers where it helps.",
    "Use either a checklist OR a table when it adds real value.",
  ],

  // Optional / plugin-dependent features
  optionalPlugins: {
    // Now supported: footnotes
    footnotes: {
      description:
        "Footnotes are supported. Use [^id] and define at the end.",
      example: "A sentence with a footnote.[^1]\n\n[^1]: Footnote text.",
    },
    definitionLists: {
      description:
        "Definition lists typically require a plugin. Test first.",
      example: "Term\n: Definition",
    },
    rawHtmlDetails: {
      description:
        "Collapsible <details> requires allowing raw HTML in your markdown pipeline. Test first.",
      example:
        "<details>\n  <summary>Click to expand</summary>\n\n  Hidden content\n</details>",
    },
    diagramsMermaid: {
      description:
        "Mermaid diagrams require a renderer/plugin. Not supported by default.",
      example: "```mermaid\ngraph TD;\n  A-->B;\n```",
    },
    // Now supported: math
    math: {
      description:
        "Math (KaTeX/LaTeX) is supported. Inline: $a+b$, Block: $$E=mc^2$$.",
      example: "$$E=mc^2$$",
    },
  },

  seoFields: {
    requiredOrCommon: ["Category", "Description", "Tags", "Excerpt"],
    optionalMeta: [
      "SEO title",
      "SEO description",
      "Structured Data Type (BlogPosting)",
      "Twitter Title",
      "Twitter Description",
    ],
    bestPractices: {
      seoTitle: "50–60 characters, include hook + brand (Wired Living).",
      seoDescription: "140–160 characters, specific and readable.",
      canonicalUrl: "https://wiredliving.blog/blog/<slug>",
      ogImage: "1200×630 recommended, /og/<slug>.png",
    },
  },

  postTemplate: {
    description: "SEO-friendly, readable structure for personal posts.",
    template: [
      "# Title",
      "",
      "![Cover image for Title](/images/covers/<slug>.png)",
      "",
      "> ℹ️ **Info",
      "> One-line context.",
      "",
      "Hook paragraph (1–3 lines).",
      "",
      "---",
      "",
      "## Section 1",
      "Short paragraphs. One idea per paragraph.",
      "",
      "## Section 2",
      "Keep it scannable.",
      "",
      "## Closing",
      "Clear takeaway + one internal link:",
      "[Next post idea](/blog/<some-slug>)",
      "",
      "– Wired Living",
    ].join("\n"),
  },
} as const;

// Helper function to get tooltip text for toolbar buttons
export function getButtonTooltip(buttonType: string): string {
  const tooltips: Record<string, string> = {
    'auto-format': 'Auto-format: Intelligently structure content, fix headings, lists, spacing, and more. Analyzes content to optimize readability.',
    'bold': 'Bold (Ctrl+B): Emphasize important words and phrases',
    'italic': 'Italic (Ctrl+I): Add subtle emphasis to text',
    'inline-code': 'Inline Code: Format filenames, commands, variables',
    'h1': 'Heading 1: Main title (use one per post)',
    'h2': 'Heading 2: Major sections (4-8 per post)',
    'h3': 'Heading 3: Subsections within H2 sections',
    'unordered-list': 'Unordered List: Bullet points for lists without order',
    'ordered-list': 'Ordered List: Numbered items for step-by-step guides',
    'checklist': 'Task List: [ ] for todo, [x] for completed',
    'link': 'Link: Use [text](/blog/slug) for internal, [text](https://...) for external',
    'image': 'Image: ![alt text](/images/path.png) - Always add descriptive alt text',
    'gif': 'GIF: ![animated gif](/path/to/animation.gif) - Insert animated GIF images',
    'video': 'Video: <video> tag for MP4/WebM videos - Supports controls and autoplay',
    'youtube': 'YouTube/Embed: <iframe> for YouTube, Vimeo, or other embeds - Auto-sized responsive',
    'code-block': 'Code Block: ```language\ncode\n``` - Add language tag for syntax highlighting',
    'blockquote': 'Blockquote: >quote - Great for emphasis and callouts',
    'divider': 'Horizontal Divider: --- - Separates major sections',
    'table': 'Table: Great for comparisons, data, or structured information',
    'callout-info': 'Info Callout: > ℹ️ **Info** - For informational notes',
    'callout-warning': 'Warning Callout: > ⚠️ **Warning** - For important warnings',
    'callout-success': 'Success Callout: > ✅ **Success** - For positive tips',
    'callout-error': 'Error Callout: > ❌ **Error** - For things to avoid',
    'footnote': 'Footnote: Add citations and references[^1] with footnote definitions',
    'definition-list': 'Definition List: Term and definition pairs - Great for glossaries',
    'keyboard-keys': 'Keyboard Keys: Auto-formats `Cmd` + `K` - Styled key combinations',
    'nested-blockquote': 'Nested Blockquote: Multi-level quotes for emphasis',
    'collapsible': 'Collapsible Section: <details> - Hide optional content behind click',
    'toc': 'Table of Contents: Auto-linked navigation for long posts',
    'progress': 'Progress Tracker: Visual task list for goals and milestones',
    'snapshot-table': 'Snapshot Table: Pre-formatted data table template',
  };
  return tooltips[buttonType] || 'Markdown formatting tool';
}

// Helper function to validate markdown structure
export function validateMarkdownStructure(content: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const lines = content.split('\n');
  let h1Count = 0;
  let inCodeBlock = false;
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check code blocks
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) continue;

    // Check H1 count
    if (trimmed.match(/^#\s/)) {
      h1Count++;
      if (h1Count > 1) {
        issues.push('Multiple H1 headings found. Use only one H1 per post.');
      }
    }

    // Check heading hierarchy
    if (trimmed.match(/^###\s/) && !content.match(/^##\s/m)) {
      issues.push('H3 heading found without H2. Maintain logical heading hierarchy.');
    }
  }

  if (h1Count === 0) {
    issues.push('No H1 heading found. Add a main title at the top.');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

// Helper function to get markdown examples by category
export function getMarkdownExamples(category: 'headings' | 'lists' | 'formatting' | 'advanced'): string {
  const examples: Record<string, string> = {
    headings: `# H1 - Main Title
## H2 - Major Section
### H3 - Subsection`,
    lists: `- Unordered item
- Another item
  - Nested item

1. Ordered item
2. Second item

- [ ] Todo item
- [x] Done item`,
    formatting: `**bold** *italic* ~~strikethrough~~
\`inline code\`
[link text](/blog/post)
![alt text](image.jpg)`,
    advanced: `> ℹ️ **Info**
> Your message here

<details>
  <summary>Click to expand</summary>
  Hidden content here
</details>

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |`,
  };
  return examples[category] || '';
}

export default WIREDLIVING_MARKDOWN_SUPPORT;
