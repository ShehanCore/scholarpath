#!/usr/bin/env bash
# Applies the migrations and seed to a scratch database on a local Postgres, runs the seed twice
# (it must be idempotent), then runs the RLS tests. Usage: PGPORT=54329 supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
P=(psql -h "${PGHOST:-localhost}" -p "${PGPORT:-5432}" -U "${PGUSER:-postgres}" -v ON_ERROR_STOP=1 -q)
"${P[@]}" -c "drop database if exists scholarpath_test" -c "create database scholarpath_test"
"${P[@]}" -d scholarpath_test -f supabase/tests/supabase-stub.sql
for f in supabase/migrations/*.sql; do "${P[@]}" -d scholarpath_test -f "$f"; done
"${P[@]}" -d scholarpath_test -f supabase/seed.sql
"${P[@]}" -d scholarpath_test -f supabase/seed.sql
"${P[@]}" -d scholarpath_test -f supabase/tests/rls.sql
echo "Database tests passed."
