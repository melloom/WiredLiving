import { generateSmartSEO, validateSEO } from '../lib/seo-generator';

/**
 * Test the Smart SEO Generator
 * Run with: npx tsx tests/test-seo-generator.ts
 */

console.log('🧪 Testing Smart SEO Generator\n');
console.log('='.repeat(60));

// Test Case 1: Blog post about Next.js
console.log('\n📝 Test 1: Technical Blog Post');
console.log('-'.repeat(60));

const test1 = generateSmartSEO(
  'How to Build a Modern Blog with Next.js and TypeScript',
  'Learn how to create a modern, performant blog using Next.js 14, TypeScript, and Tailwind CSS',
  `
# How to Build a Modern Blog with Next.js and TypeScript

In this comprehensive guide, you'll discover how to build a professional blog platform using the latest web technologies. 

## Why Next.js?

Next.js provides excellent performance, SEO capabilities, and developer experience. It's perfect for content-heavy websites.

## Getting Started

First, you'll need to set up your development environment. Install Node.js and create a new Next.js project.

## Key Features

- Server-side rendering for better SEO
- TypeScript for type safety  
- Tailwind CSS for styling
- MDX support for rich content
- Image optimization
- Performance monitoring

Learn how to implement each of these features step by step.
  `,
  'Development'
);

console.log('Title:', test1.seoTitle);
console.log('Description:', test1.seoDescription);
console.log('Twitter Title:', test1.twitterTitle);
console.log('Twitter Description:', test1.twitterDescription);
console.log('Keywords:', test1.keywords.slice(0, 5).join(', '));

const validation1 = validateSEO(test1);
console.log('\n✅ Valid:', validation1.valid);
if (validation1.warnings.length > 0) {
  console.log('⚠️  Warnings:', validation1.warnings);
}

// Test Case 2: Short title that needs enhancement
console.log('\n📝 Test 2: Short Title Enhancement');
console.log('-'.repeat(60));

const test2 = generateSmartSEO(
  'Python Tips',
  '',
  `
# Python Tips

Here are 10 essential Python tips that will improve your code quality and productivity.

## 1. Use List Comprehensions

List comprehensions make your code more readable and faster.

## 2. Leverage Built-in Functions

Python has many powerful built-in functions you should know.

## 3. Virtual Environments

Always use virtual environments for your projects.
  `,
  'Programming'
);

console.log('Original Title: "Python Tips"');
console.log('Enhanced Title:', test2.seoTitle);
console.log('Description:', test2.seoDescription);

const validation2 = validateSEO(test2);
console.log('\n✅ Valid:', validation2.valid);
if (validation2.warnings.length > 0) {
  console.log('⚠️  Warnings:', validation2.warnings);
}

// Test Case 3: Long title that needs truncation
console.log('\n📝 Test 3: Long Title Smart Truncation');
console.log('-'.repeat(60));

const test3 = generateSmartSEO(
  'The Ultimate Complete Comprehensive Guide to Building Progressive Web Applications with React, TypeScript, and Modern DevOps Practices',
  'An extremely detailed and comprehensive exploration of everything you need to know',
  'Learn about PWAs, React hooks, TypeScript generics, CI/CD pipelines, and deployment strategies.',
  'Web Development'
);

console.log('Original Title: "The Ultimate Complete Comprehensive Guide..." (123 chars)');
console.log('Optimized Title:', test3.seoTitle, `(${test3.seoTitle.length} chars)`);
console.log('Description:', test3.seoDescription);

const validation3 = validateSEO(test3);
console.log('\n✅ Valid:', validation3.valid);
if (validation3.warnings.length > 0) {
  console.log('⚠️  Warnings:', validation3.warnings);
}

// Test Case 4: Content with markdown that needs cleaning
console.log('\n📝 Test 4: Markdown Cleanup');
console.log('-'.repeat(60));

const test4 = generateSmartSEO(
  'Understanding **React Hooks**',
  '> This is a **great** guide with `code` examples',
  `
# Understanding React Hooks

![Cover image](/images/hooks.png)

**React Hooks** allow you to use state and other React features without writing a class. Learn more at [React Docs](https://react.dev).

\`\`\`jsx
const [count, setCount] = useState(0);
\`\`\`

> **Note:** Hooks were introduced in React 16.8

## Why Use Hooks?

They make your code more readable and reusable. How can you master React Hooks quickly?
  `,
  'React'
);

console.log('Cleaned Title:', test4.seoTitle);
console.log('Cleaned Description:', test4.seoDescription);
console.log('Keywords:', test4.keywords.slice(0, 5).join(', '));

const validation4 = validateSEO(test4);
console.log('\n✅ Valid:', validation4.valid);
if (validation4.warnings.length > 0) {
  console.log('⚠️  Warnings:', validation4.warnings);
}

// Test Case 5: Empty/Invalid Input
console.log('\n📝 Test 5: Empty Input Handling');
console.log('-'.repeat(60));

const test5 = generateSmartSEO('', '', '', '');

console.log('Title:', test5.seoTitle);
console.log('Description:', test5.seoDescription);

const validation5 = validateSEO(test5);
console.log('\n✅ Valid:', validation5.valid);
if (validation5.warnings.length > 0) {
  console.log('⚠️  Warnings:', validation5.warnings);
}

console.log('\n' + '='.repeat(60));
console.log('✅ All tests completed!\n');
