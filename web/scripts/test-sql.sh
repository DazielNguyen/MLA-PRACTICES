#!/usr/bin/env bash
set -euo pipefail
ML_SCRIPT_ROOT=$(cd "$(dirname "$0")/.." && pwd)
ML_PG_BIN=$(pg_config --bindir)
ML_TEST_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/ml-practice-sql.XXXXXX")
cleanup() {
  "$ML_PG_BIN/pg_ctl" -D "$ML_TEST_ROOT/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$ML_TEST_ROOT"
}
trap cleanup EXIT
"$ML_PG_BIN/initdb" -D "$ML_TEST_ROOT/data" -A trust --no-locale --encoding=UTF8 > "$ML_TEST_ROOT/init.log"
"$ML_PG_BIN/pg_ctl" -D "$ML_TEST_ROOT/data" -l "$ML_TEST_ROOT/server.log" -o "-k $ML_TEST_ROOT -p 55439 -h ''" start >/dev/null
for ML_SQL_FILE in "$ML_SCRIPT_ROOT/supabase/test-bootstrap.sql" "$ML_SCRIPT_ROOT/supabase/001_study_profiles.sql" "$ML_SCRIPT_ROOT/supabase/002_expanded_question_bank.sql" "$ML_SCRIPT_ROOT/supabase/002_expanded_question_bank.sql" "$ML_SCRIPT_ROOT/supabase/security-tests.sql"; do
  "$ML_PG_BIN/psql" -X -v ON_ERROR_STOP=1 -h "$ML_TEST_ROOT" -p 55439 -d postgres -f "$ML_SQL_FILE"
done
