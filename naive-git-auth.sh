#!/bin/sh
# Lets git, and so npm, fetch the private naive-framework dependency (github:tchjhnsn/naive, EE-119) with the
# read-only token in NAIVE_READ_TOKEN. CI runs it before npm ci; Vercel runs it through scripts/naive-install.sh.
# npm may write the dependency's URL as https://github.com/, ssh://git@github.com/ or git@github.com:, so all three
# are rewritten to the token URL. Without NAIVE_READ_TOKEN it does nothing (a developer's own git credentials apply).
#
#   NAIVE_READ_TOKEN=... sh scripts/naive-git-auth.sh
set -e
if [ -z "$NAIVE_READ_TOKEN" ]; then
  echo "NAIVE_READ_TOKEN is not set: git uses its own credentials for tchjhnsn/naive"
  exit 0
fi
url="https://x-access-token:${NAIVE_READ_TOKEN}@github.com/"
git config --global --unset-all "url.${url}.insteadOf" >/dev/null 2>&1 || true
git config --global --add "url.${url}.insteadOf" "https://github.com/"
git config --global --add "url.${url}.insteadOf" "ssh://git@github.com/"
git config --global --add "url.${url}.insteadOf" "git@github.com:"
echo "git fetches github.com with the read-only token in NAIVE_READ_TOKEN"
