#!/usr/bin/env bash
set -e

cleanup() {
  echo ""
  echo "Shutting down..."
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

echo "Starting Laravel backend..."
php artisan serve &
BACKEND_PID=$!

echo "Starting Vite frontend..."
cd frontend
npx vite &
FRONTEND_PID=$!
cd ..

wait
