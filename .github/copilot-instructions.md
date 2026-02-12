# Copilot Instructions for Toolbox

## Primary Reference

**See [AGENTS.md](../AGENTS.md) for comprehensive guidance** on this repository's tech stack, architecture, commands, and development practices.

## Critical: Hoist Framework Documentation

**Before writing or modifying any client-side code**, you MUST consult the hoist-react documentation at [`docs/hoist-react/README.md`](../docs/hoist-react/README.md). This is the authoritative reference for:

- All available Hoist components and their APIs
- Established patterns and conventions
- Architecture guidance (Models, Components, Services)
- Built-in functionality you should use instead of reinventing

**Skipping the Hoist docs risks producing code that conflicts with framework patterns or misses existing functionality.** The documentation is shipped with the library and optimized for AI agent consumption.

For server-side work, consult the existing `grails-app/` code and the [hoist-core GitHub repository](https://github.com/xh/hoist-core).

## Copilot Workflow Guidelines

### Before Starting Any Task

1. **Read AGENTS.md** for project context
2. **Consult hoist-react docs** (for client work) via the index at `docs/hoist-react/README.md`
3. Review existing similar code in the repository
4. Understand the Model + Component pairing pattern (see hoist-react AGENTS.md)

### When Writing Code

- **Follow existing patterns** - This is a demo app showcasing Hoist framework best practices
- **Use Hoist components** - Don't create custom implementations of functionality Hoist provides
- **Maintain consistency** - Match the style and structure of existing code
- **Check the docs first** - Before implementing any UI feature, verify if Hoist has a built-in solution

### Code Quality Standards

- **Linting**: All code must pass ESLint and Stylelint (auto-runs on commit via Husky)
- **TypeScript**: Preferred for all new client-side code
- **Formatting**: Prettier config enforced (100 char width, 4-space indent for JS/TS, single quotes, no trailing commas)
- **Comments**: Only add when necessary to explain complex logic; match existing comment style

### Testing & Validation

- **Manual testing required** - No extensive automated test infrastructure exists
- **Run locally** - Test both server (`./gradlew bootRun`) and client (`yarn start`) before committing
- **Verify in browser** - Exercise the actual UI/API to confirm changes work correctly

### Security & Safety

- **Never commit secrets** - Credentials belong in `.env` file (gitignored)
- **Check dependencies** - Run security scanning before adding new packages
- **Respect boundaries**:
  - Don't modify framework code (`hoist-core`, `hoist-react`)
  - Don't change build configs unless required
  - Don't alter `.env`, certificates, or Auth0 configuration

## Common Pitfalls to Avoid

1. **Don't skip the Hoist documentation** - It's comprehensive and will save time
2. **Don't reinvent components** - Hoist likely has what you need already built
3. **Don't modify framework code** - Work in the application layer only
4. **Don't commit without linting** - Pre-commit hooks will catch this, but fix issues early
5. **Don't add dependencies without security review** - Check for vulnerabilities first

## Quick Reference

For detailed information on tech stack, commands, architecture, and configuration, see [AGENTS.md](../AGENTS.md).

For Hoist framework details, start with [`docs/hoist-react/README.md`](../docs/hoist-react/README.md).
