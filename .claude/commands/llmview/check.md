Run typechecks and build checks on changed directories, then fix any issues.

1. Run `git status --porcelain -- extension/ website/` to detect which directories have changes.
2. For each changed directory, run the appropriate checks:
   - **extension/**: `cd extension && npm run build` (this runs `tsc && vite build`, covering both typecheck and build)
   - **website/**: `cd website && npx astro check` for typechecks, then `cd website && npm run build` for the build
3. If any check fails, analyze the errors and fix them. Re-run the checks until they pass.
4. If nothing changed in either directory, report that everything is clean.
