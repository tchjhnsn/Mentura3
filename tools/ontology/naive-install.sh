#!/bin/sh
# Vercel install command for the site (site/vercel.json) and the console (console/vercel.json).
# Sets up NAIVE_READ_TOKEN when it is present, then installs from the repository root, where the one lockfile is.
set -e
cd "$(dirname "$0")/.."
sh scripts/naive-git-auth.sh
npm ci
