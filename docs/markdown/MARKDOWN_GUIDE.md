# Markdown Guide - WiredLiving

Complete guide to all markdown features supported in your blog posts.

## Table of Contents
- [Basic Formatting](#basic-formatting)
- [Headings](#headings)
- [Lists](#lists)
- [Links & Images](#links--images)
- [Code](#code)
- [Blockquotes](#blockquotes)
- [Tables](#tables)
- [Advanced Features](#advanced-features)

---

## Basic Formatting

### Bold
```markdown
**bold text** or __bold text__
```
**bold text**

### Italic
```markdown
*italic text* or _italic text_
```
*italic text*

### Bold + Italic
```markdown
***bold and italic*** or ___bold and italic___
```
***bold and italic***

### Strikethrough
```markdown
~~strikethrough~~
```
~~strikethrough~~

### Highlight (Inline Code)
```markdown
The key is `consistency`.
```
The key is `consistency`.

---

## Headings

```markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
```

---

## Lists

### Unordered Lists
```markdown
- First item
- Second item
- Third item
  - Nested item
  - Another nested item
```

### Ordered Lists
```markdown
1. First item
2. Second item
3. Third item
   1. Nested item
   2. Another nested item
```

### Task Lists (Checklists)
```markdown
- [ ] Task 1
- [ ] Task 2
- [x] Completed task
```

**Progress Tracker Example:**
```markdown
### Progress
- [x] Launch blog
- [x] Write first post
- [ ] Write 10 posts
- [ ] Add newsletter
- [ ] Reach 1000 readers
```

---

## Links & Images

### Links
```markdown
[Link text](https://example.com)
[Internal link](/blog/post-slug)
```

### Images
```markdown
![Alt text](https://example.com/image.jpg)
![Local image](/images/photo.jpg)
```

### Images with Links
```markdown
[![Alt text](image-url)](link-url)
```

---

## Code

### Inline Code
```markdown
Use `inline code` for short snippets.
```

### Keyboard Keys
```markdown
Press `Cmd` + `K` to search.
Press `Ctrl` + `C` to copy.
```
Press `Cmd` + `K` to search.

### Code Blocks
````markdown
```javascript
function hello() {
  console.log("Hello, World!");
}
```
````

Supported languages: javascript, typescript, python, html, css, bash, json, markdown, and more.

---

## Blockquotes

### Simple Blockquote
```markdown
> This is a blockquote
> It can span multiple lines
```

### Nested Blockquotes
```markdown
> Main quote
>
> > Nested quote
> >
> > > Double nested quote
```

### Callouts (Special Blockquotes)

**Info:**
```markdown
> ℹ️ **Info**
> This is an informational callout
```

**Warning:**
```markdown
> ⚠️ **Warning**
> This is a warning callout
```

**Success:**
```markdown
> ✅ **Success**
> This is a success callout
```

**Error:**
```markdown
> ❌ **Error**
> This is an error callout
```

**Auto-detected Callouts:**
```markdown
Note: This will be automatically formatted as a callout
Tip: This will also be formatted
Warning: Same here
Important: And this too
```

---

## Tables

### Basic Table
```markdown
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

### Aligned Columns
```markdown
| Left | Center | Right |
|:-----|:------:|------:|
| L1   | C1     | R1    |
| L2   | C2     | R2    |
```

### Snapshot Table Example
```markdown
| Week | Focus | Result |
|------|-------|--------|
| 1    | Writing | 1 post |
| 2    | Design | New theme |
| 3    | Marketing | 100 views |
```

---

## Advanced Features

### Horizontal Divider
```markdown
---
or
***
or
___
```

### Footnotes
```markdown
This is a statement with a footnote.[^1]

And another statement with a footnote.[^2]

[^1]: This is the first footnote text.
[^2]: This is the second footnote text.
```

### Definition Lists
```markdown
Term
: Definition of the term

Another Term
: Another definition
: Can have multiple definitions
```

### Collapsible Sections
```markdown
<details>
  <summary>Click to expand</summary>

  Hidden content here. You can use **markdown** inside!
  
  - Lists work
  - Code blocks too
  
  ```javascript
  console.log("Hidden code");
  ```
</details>
```

### Table of Contents
```markdown
## Table of Contents
- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Features](#features)
- [Conclusion](#conclusion)
```

*Note: Headings automatically generate anchor links. Use lowercase, replace spaces with hyphens.*

---

## Auto-Format Features

The **Auto-Format** button in the toolbar will intelligently analyze and format your content:

### Content Analysis & Structure
1. ✅ Detect and convert plain text headings to proper markdown (H1-H6)
2. ✅ Identify section types (Introduction, Overview, Conclusion, etc.)
3. ✅ Recognize questions and format them as headings
4. ✅ Determine heading levels based on content hierarchy
5. ✅ Add proper spacing between all sections automatically

### Lists & Bullets
6. ✅ Convert various bullet styles (-, •, *, ○, ◦, ▪, ▫) to standard markdown
7. ✅ Format numbered lists with proper syntax
8. ✅ Fix and normalize checkbox/task list formatting
9. ✅ Add proper spacing before/after lists
10. ✅ Maintain nested list structure

### Links & References
11. ✅ Clean up and standardize markdown link syntax
12. ✅ Fix image markdown formatting
13. ✅ Wrap bare URLs in angle brackets
14. ✅ Normalize footnote references and definitions

### Special Formatting
15. ✅ Detect and format callouts (Note:, Tip:, Warning:, Important:, etc.)
16. ✅ Convert quoted text to proper blockquotes
17. ✅ Add keyboard key formatting (`Cmd`, `Ctrl`, `Alt`, shortcuts)
18. ✅ Fix and preserve code blocks with language tags
19. ✅ Format and align markdown tables
20. ✅ Normalize horizontal rules

### Text Cleanup
21. ✅ Fix bold/italic markdown syntax
22. ✅ Remove excessive blank lines (max 2)
23. ✅ Ensure proper spacing after punctuation
24. ✅ Remove trailing whitespace from lines
25. ✅ Fix multiple spaces in regular text

### Smart Detection
26. ✅ Detect "Table of Contents" and format as heading
27. ✅ Preserve HTML elements (details, summary, etc.)
28. ✅ Maintain code block content without changes
29. ✅ Recognize definition lists
30. ✅ Handle nested blockquotes properly

**Pro Tip**: The auto-format function analyzes your content context to make intelligent decisions about heading levels, spacing, and structure. It won't damage existing proper markdown!

---

## Tips for Better Markdown

1. **Use blank lines** between different elements (paragraphs, lists, headings)
2. **Be consistent** with list markers (all `-` or all `*`)
3. **Use descriptive link text** instead of "click here"
4. **Add alt text** to all images for accessibility
5. **Use code blocks** for multi-line code, inline code for short snippets
6. **Structure content** with headings for better readability
7. **Use tables** for data that fits a tabular format
8. **Add task lists** to show progress or checklists
9. **Use callouts** to highlight important information
10. **Test preview** before publishing
11. **Run Auto-Format** to clean up messy content automatically
12. **Let AI help** - paste content and auto-format will structure it

---

## Markdown Toolbar Shortcuts

The toolbar provides quick access to:

- **Auto-Format**: Intelligently analyze and format your entire post
- **Bold/Italic**: Text formatting
- **H1/H2/H3**: Heading levels
- **Lists**: Unordered, ordered, and task lists
- **Links**: Internal and external links
- **Images**: Insert images (with gallery support)
- **Code**: Inline code and code blocks
- **Blockquote**: Simple quotes
- **Divider**: Horizontal rules
- **Table**: Pre-formatted table structure
- **Callouts**: Info, Warning, Success, Error
- **Advanced**: Footnotes, definitions, keyboard keys, nested quotes, collapsibles, TOC, progress trackers, snapshot tables

---

## Examples

### Blog Post Template

```markdown
# My First Blog Post

A brief introduction to what this post is about.

## Table of Contents
- [Introduction](#introduction)
- [Main Content](#main-content)
- [Conclusion](#conclusion)

## Introduction

> ℹ️ **Note**
> This is an important introduction point.

Welcome to my blog post! Here's what we'll cover today.

## Main Content

### Key Points

- First important point
- Second important point
- Third important point

### Code Example

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
```

### Progress

- [x] Write outline
- [x] Draft content
- [ ] Add images
- [ ] Publish

## Conclusion

Thanks for reading! Press `Cmd` + `D` to bookmark this page.

---

**References:**
- [External Resource](https://example.com)
- [Another Post](/blog/related-post)
```

---

## Need Help?

The markdown toolbar provides visual buttons for all common features. Hover over each button to see what it does, and use the **Auto-Format** button to clean up your markdown automatically.

For technical questions, check the [Contributing Guide](CONTRIBUTING.md).
