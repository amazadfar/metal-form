#!/usr/bin/env bash
# Restart the preview server on :4321 without matching this shell's own command line.
set -u
PORT="${1:-4321}"
PID=$(ss -lptnH "sport = :$PORT" 2>/dev/null | grep -oP 'pid=\K[0-9]+' | head -1)
[ -n "${PID:-}" ] && kill "$PID" 2>/dev/null
sleep 0.5
cd "$(dirname "$0")/../.." || exit 1
nohup npx astro preview --port "$PORT" > /tmp/mf-preview-$PORT.log 2>&1 &
for i in $(seq 1 30); do curl -sf -o /dev/null "http://localhost:$PORT/" && { echo "preview up on $PORT"; exit 0; }; sleep 1; done
echo "preview FAILED"; tail -20 /tmp/mf-preview-$PORT.log; exit 1
