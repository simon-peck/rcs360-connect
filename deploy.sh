#!/bin/bash

echo "📦 Staging all changes..."
git add .

DEFAULT_MSG="🛠 Auto-deploy commit $(date '+%Y-%m-%d %H:%M:%S')"
echo "✅ Committing with message: $DEFAULT_MSG"
git commit -m "$DEFAULT_MSG"

echo "🚀 Pushing to remote 'main'..."
git push origin main

echo "✅ Code pushed. Vercel will now auto-deploy."