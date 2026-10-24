#!/usr/bin/env sh
# Runs the Next.js CLI while locating the Node runtime explicitly.
#
# Why: on some Windows setups (this one included) node.exe is not on the
# PATH that npm's script-shell inherits, so plain `next dev` fails with
# "'node' is not recognized". This wrapper probes common install locations
# before falling back to PATH.
#
# Works on Windows (Git Bash) and macOS/Linux alike.

if command -v node >/dev/null 2>&1; then
  NODE=node
elif [ -x "/c/Program Files/nodejs/node.exe" ]; then
  NODE="/c/Program Files/nodejs/node.exe"
else
  echo "error: node runtime not found on PATH or at /c/Program Files/nodejs." >&2
  echo "Restart your terminal or reinstall Node.js, then try again." >&2
  exit 1
fi

if [ -x "/c/Program Files/nodejs/node.exe" ]; then
  export PATH="/c/Program Files/nodejs:$PATH"
fi

exec "$NODE" "$(dirname "$0")/../node_modules/next/dist/bin/next" "$@"
