#!/bin/sh
# Lets git, and so npm, fetch naive-framework (EE-119, same commit).
# The lockfile names git+https. A builder image may still rewrite that to SSH, which fails with
# "Permission denied (publickey)" when no key is loaded. This script removes that rewrite.
# CI runs it before npm ci. Vercel runs it through scripts/naive-install.sh.
# When NAIVE_READ_TOKEN is set, GitHub URLs use that token. When it is unset, they stay https.
# Anonymous https works once tchjhnsn/naive is public. Until then a private fetch still needs the token.
#
#   NAIVE_READ_TOKEN=... sh scripts/naive-git-auth.sh
set -e

# Drop rewrites that turn https://github.com/ into an SSH remote. Git stores the key as insteadOf.
git config --global --unset-all "url.ssh://git@github.com/.insteadOf" >/dev/null 2>&1 || true
git config --global --unset-all "url.git@github.com:.insteadOf" >/dev/null 2>&1 || true

if [ -z "$NAIVE_READ_TOKEN" ]; then
  git config --global --unset-all "url.https://github.com/.insteadOf" >/dev/null 2>&1 || true
  git config --global --add "url.https://github.com/.insteadOf" "ssh://git@github.com/"
  git config --global --add "url.https://github.com/.insteadOf" "git@github.com:"
  echo "NAIVE_READ_TOKEN is not set: git uses https://github.com/ for tchjhnsn/naive"
  exit 0
fi

url="https://x-access-token:${NAIVE_READ_TOKEN}@github.com/"
git config --global --unset-all "url.${url}.insteadOf" >/dev/null 2>&1 || true
git config --global --add "url.${url}.insteadOf" "https://github.com/"
git config --global --add "url.${url}.insteadOf" "ssh://git@github.com/"
git config --global --add "url.${url}.insteadOf" "git@github.com:"
echo "git fetches github.com with the read-only token in NAIVE_READ_TOKEN"
