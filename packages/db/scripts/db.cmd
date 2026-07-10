@echo off
setlocal
set DATABASE_URL=%DATABASE_URL%
node "%~dp0..\..\node_modules\.pnpm\drizzle-kit@0.31.10\node_modules\drizzle-kit\bin.cjs" %*
