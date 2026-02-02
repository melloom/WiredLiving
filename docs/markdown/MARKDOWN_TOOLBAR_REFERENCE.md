# Markdown Toolbar Quick Reference

## Text Formatting
| Button | Output | Syntax |
|--------|--------|--------|
| **B** | **Bold** | `**text**` |
| *I* | *Italic* | `*text*` |
| `</>` | `code` | `` `code` `` |

## Headings
| Button | Output | Syntax |
|--------|--------|--------|
| H1 | # Heading 1 | `# text` |
| H2 | ## Heading 2 | `## text` |
| H3 | ### Heading 3 | `### text` |

## Lists
| Button | Output | Syntax |
|--------|--------|--------|
| ≡ | Unordered list | `- item` |
| 1. | Ordered list | `1. item` |
| ☑ | Checklist | `- [ ] task` |

## Links & Media
| Button | Output | Syntax |
|--------|--------|--------|
| 🔗 | Link | `[text](url)` |
| 🖼️ | Image | `![alt](url)` |

## Code
| Button | Output | Syntax |
|--------|--------|--------|
| `{...}` | Code block | ` ```language ` |

## Special Blocks
| Button | Output | Syntax |
|--------|--------|--------|
| " | Blockquote | `> quote` |
| — | Divider | `---` |
| ⊞ | Table | See guide |

## Callouts Dropdown
| Option | Output |
|--------|--------|
| ℹ️ Info | Blue info box |
| ⚠️ Warning | Yellow warning box |
| ✅ Success | Green success box |
| ❌ Error | Red error box |

## Advanced Dropdown
| Option | Use Case | Syntax |
|--------|----------|--------|
| 📌 Footnote | References | `text[^1]` + `[^1]: note` |
| 📖 Definition | Glossary | `Term\n: Definition` |
| ⌨️ Keys | Shortcuts | `Press Cmd + K` |
| 💬 Nested Quote | Quote within quote | `> >\n> > quote` |
| 📂 Collapsible | Hide content | `<details><summary>...` |
| 📋 TOC | Navigation | Links to headings |
| 📊 Progress | Task tracker | Formatted checklist |
| 📸 Snapshot | Data table | Pre-made table |

## Auto-Format Magic ✨

Click **Auto-Format** to:
- Convert plain text to proper headings
- Fix bullet points and lists
- Add spacing between sections
- Format blockquotes and callouts
- Normalize checkboxes
- Add keyboard key styling
- Clean up markdown syntax

## Pro Tips

1. **Always use blank lines** between different elements
2. **Preview before publishing** to check rendering
3. **Use Auto-Format** on messy content to clean it up
4. **Hover over buttons** to see tooltips
5. **Gallery images** appear as quick-insert buttons
6. **Keyboard shortcuts** work: Ctrl+B (bold), Ctrl+I (italic)

## Common Patterns

### Blog Post Start
```markdown
# Post Title

Brief intro paragraph.

## Table of Contents
- [Section 1](#section-1)
- [Section 2](#section-2)
```

### Important Note
```markdown
> ℹ️ **Note**
> This is important information
```

### Code Example
````markdown
```javascript
const example = "code";
```
````

### Task Progress
```markdown
### Goals
- [x] Completed item
- [ ] Todo item
```

### Keyboard Shortcut
```markdown
Press `Cmd` + `K` to search
```

### Show/Hide Content
```markdown
<details>
  <summary>Click to expand</summary>
  Hidden details here
</details>
```

---

For full documentation, see [MARKDOWN_GUIDE.md](MARKDOWN_GUIDE.md)
