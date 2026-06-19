@echo off
rem Pre‑commit hook for Windows environments
rem -------------------------------------------------
rem Example: run linting and tests before a commit

echo Running ESLint...
npm run lint
if %errorlevel% neq 0 (
  echo Linting failed. Commit aborted.
  exit /b 1
)

echo Running unit tests...
npm test
if %errorlevel% neq 0 (
  echo Tests failed. Commit aborted.
  exit /b 1
)

echo All checks passed. Proceeding with commit.
exit /b 0
