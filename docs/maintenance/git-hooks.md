# Git Hooks Documentation

## Pre-commit Hook

This hook runs `npm run lint` and `npm test` to ensure code quality before each commit. It aborts the commit if any linting errors or failing tests are detected.
