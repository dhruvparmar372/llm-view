Run typechecks and build checks on changed directories, fix any issues, then commit and push.

1. Run `git status --porcelain -- extension/ website/` to detect which directories have changes.
2. For each changed directory, run the appropriate checks:
   - **extension/**: `cd extension && bun run build` (this runs `tsc && vite build`, covering both typecheck and build)
   - **website/**: `cd website && bun astro check` for typechecks, then `cd website && bun run build` for the build
3. If any check fails, analyze the errors and fix them. Re-run the checks until they pass.
4. If nothing changed in either directory, report that everything is clean and stop here.
5. Once all checks pass, use `/commit` to commit the changed files, then push to origin with `git push`.
