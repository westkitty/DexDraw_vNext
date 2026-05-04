# Acceptance Checklist

## Critical acceptance

- [ ] Monorepo installs with pnpm.
- [ ] TypeScript typecheck passes.
- [ ] Build passes.
- [ ] Unit tests pass.
- [ ] Server starts with safe env validation.
- [ ] Client starts locally.
- [ ] Board can be created.
- [ ] Board can be joined with token.
- [ ] Unknown user cannot edit.
- [ ] View role cannot draw.
- [ ] Edit role can draw.
- [ ] Two clients sync one stroke through server.
- [ ] Reload restores persisted stroke.
- [ ] Invalid WebSocket payload rejected.
- [ ] Oversized payload rejected.
- [ ] No provider secret appears in client bundle.

## Product acceptance

- [ ] Template picker works.
- [ ] Rectangle tool works.
- [ ] Ellipse tool works.
- [ ] Text tool works.
- [ ] Cursor overlay works.
- [ ] Laser pointer works as ephemeral presence.
- [ ] PNG export works.
- [ ] Markdown export works if implemented.
- [ ] PDF export works if implemented.

## Documentation acceptance

- [ ] README explains local development.
- [ ] API routes documented.
- [ ] WebSocket protocol documented.
- [ ] Security notes documented.
- [ ] Known limitations documented.
