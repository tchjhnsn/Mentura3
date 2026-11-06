#!/bin/sh
# Vercel's install command for the site (site/vercel.json): set up the read-only token for the private
# naive-framework dependency (scripts/naive-git-auth.sh), then install from the repository root, where the one
# lockfile is (the site is an npm workspace).
set -e
cd "$(dirname "$0")/.."
sh scripts/naive-git-auth.sh
npm ci
