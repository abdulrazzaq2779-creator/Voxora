#!/bin/sh
# Smoke-test Vervue AI route health.
#
# Usage:
#   npm run build          # required once — serves the production build
#   npm run smoke          # starts an ephemeral server (or reuses SMOKE_BASE_URL)
#
# Exits non-zero if any route or asset is unhealthy.
set -u

PORT="${SMOKE_PORT:-3999}"
BASE="${SMOKE_BASE_URL:-http://localhost:$PORT}"
STARTED=0

# Locate the Node runtime the same way run-next.sh does — on some Windows
# setups node.exe is not on the PATH npm's script shell inherits.
if command -v node >/dev/null 2>&1; then
  NODE=node
elif [ -x "/c/Program Files/nodejs/node.exe" ]; then
  NODE="/c/Program Files/nodejs/node.exe"
else
  echo "error: node runtime not found on PATH or at /c/Program Files/nodejs." >&2
  exit 1
fi

# Start an ephemeral production server unless one is already reachable.
if ! curl -s -o /dev/null --max-time 2 "$BASE/"; then
  "$NODE" node_modules/next/dist/bin/next start -p "$PORT" > /tmp/vervue-smoke.log 2>&1 &
  SRV=$!
  STARTED=1
  i=0
  while [ $i -lt 30 ]; do
    if curl -s -o /dev/null --max-time 1 "$BASE/"; then break; fi
    i=$((i + 1))
    sleep 0.5
  done
  if ! curl -s -o /dev/null --max-time 1 "$BASE/"; then
    echo "FAIL: server did not become ready (see /tmp/vervue-smoke.log)"
    kill "$SRV" 2>/dev/null
    exit 1
  fi
fi

cleanup() {
  [ "$STARTED" = "1" ] && kill "$SRV" 2>/dev/null
}
trap cleanup EXIT INT TERM

FAIL=0

check() {
  expected="$1"
  path="$2"
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$BASE$path")
  if [ "$code" = "$expected" ]; then
    echo "ok   $code $path"
  else
    echo "FAIL $code (expected $expected) $path"
    FAIL=1
  fi
}

# Marketing + auth
check 200 /
check 200 /sign-in
check 200 /sign-up
# Recruiter app
check 200 /dashboard
check 200 /interviews
check 200 /interviews/new
check 200 /interviews/senior-fe
check 200 /candidates
check 200 /candidates/demo
check 200 /candidates/senior-fe
check 200 /questions
check 200 /reports
check 200 /settings
# Candidate flow
check 200 /my-interviews
check 200 /invite/demo
check 200 /interview/demo
check 200 /interview/demo/complete
# Assets + metadata
check 200 /icon.svg
check 200 /manifest.webmanifest
check 200 /opengraph-image
# Unknown routes hit the branded 404
check 404 /this-route-does-not-exist

if [ "$FAIL" = "0" ]; then
  echo "SMOKE PASS: all routes healthy"
else
  echo "SMOKE FAIL: one or more routes unhealthy"
fi
exit "$FAIL"
