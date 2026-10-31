#!/bin/sh
# Збирає один файл index.ts для Supabase Edge Function з core.js і server.part.ts
cd "$(dirname "$0")/functions/api"
{ echo '// Згенеровано build.sh — редагуйте core.js і server.part.ts'; echo '// @ts-nocheck'; grep -v '^// @ts-nocheck' server.part.ts | grep '^import '; sed 's/^export //' core.js; grep -v '^import ' server.part.ts | grep -v '^// @ts-nocheck'; } > index.ts
