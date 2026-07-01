# Development Applications (AU) — Build Review

This file exists only to create a reviewable PR. All code is already deployed on `main`.

**Merge this PR to acknowledge the build.** Closing without merging is also fine.

## Links

- **GitHub Pages:** https://ben-gy.github.io/au-planning/ *(redirects to custom domain once DNS is set)*
- **Custom domain:** https://au-planning.benrichardson.dev *(live after DNS + cert)*

## DNS setup

CNAME record has been created in Cloudflare automatically:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `au-planning` | `ben-gy.github.io` | DNS only (grey cloud) |

TLS cert cycle has been triggered. If not live after 5 minutes, run:
```bash
gh api repos/ben-gy/au-planning/pages -X PUT -f cname=""
sleep 3
gh api repos/ben-gy/au-planning/pages -X PUT -f cname="au-planning.benrichardson.dev"
```
