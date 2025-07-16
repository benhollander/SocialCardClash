# GitHub Pages Deployment Guide

This guide explains how to deploy your Party Cards game to GitHub Pages.

## Current Issue
The project is currently configured to build files into `dist/public/` directory, but GitHub Pages expects the `index.html` file to be either:
1. In the root directory of your repository
2. In a `docs/` folder

## Solution Options

### Option 1: Use GitHub Actions (Recommended)
Create a GitHub Action that builds and deploys to GitHub Pages:

1. Create `.github/workflows/deploy.yml` in your repository:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build
      run: npm run build

    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main'
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist/public
```

### Option 2: Manual Build and Copy
1. Run `npm run build` locally
2. Copy contents of `dist/public/` to a `docs/` folder in your repository root
3. Configure GitHub Pages to serve from the `docs/` folder

### Option 3: Modify Vite Config (For Repository Owners)
If you have full control over the configuration:

1. Change the build output directory to build directly to the repository root or docs folder
2. Update the base path in vite.config.ts to match your GitHub repository name

## Current Configuration
- Base path: `/SocialCardClash/`
- Build output: `dist/public/`
- Repository structure: Full-stack app with React frontend

## Steps to Deploy

1. Choose one of the options above
2. If using GitHub Actions, enable Pages in your repository settings
3. Set the Pages source to "GitHub Actions" if using Option 1, or "Deploy from a branch" with `/docs` folder if using Option 2
4. Push your changes and the deployment will happen automatically

## Important Notes
- The game is currently set up as a full-stack application with Express backend
- For GitHub Pages (static hosting), you'll need to modify the game to work without the backend
- Consider using a serverless backend (like Vercel, Netlify Functions) for the multiplayer functionality
- Or deploy to a platform that supports full-stack apps (like Vercel, Railway, or Heroku)

## Alternative Deployment Platforms
Since this is a full-stack app, consider these platforms that support both frontend and backend:
- **Vercel**: Excellent for React + API routes
- **Railway**: Great for full Node.js apps
- **Heroku**: Traditional platform-as-a-service
- **Render**: Modern alternative to Heroku