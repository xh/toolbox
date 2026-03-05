# CLAUDE.md

See [AGENTS.md](./AGENTS.md) for AI coding agent guidance for this repository.

## Hoist Developer Tools and Documentation

**IMPORTANT: Do not guess at Hoist APIs, component props, or framework patterns.** The hoist-react
framework ships dedicated tools that provide structured access to all framework documentation and
TypeScript type information. **You MUST use these tools before writing or modifying Hoist application
code** to understand available components, configuration patterns, and common pitfalls. The Hoist
package READMEs and concept docs are the authoritative reference for how the framework works --
skipping them risks producing code that conflicts with established patterns or misses built-in
functionality.

Two interfaces are available. Both share the same underlying registries and produce identical output:

**MCP Server (hoist-react)** -- If a hoist-react MCP server is configured in your environment, use
the `hoist-search-docs`, `hoist-list-docs`, `hoist-search-symbols`, `hoist-get-symbol`, and
`hoist-get-members` tools, plus `hoist://docs/{id}` resources for direct document access.

**CLI Tools** -- For environments without MCP support, or when you prefer shell commands. These are
`bin` entries in the hoist-react `package.json` and are available via `npx` in any project that
depends on hoist-react:

```bash
# Documentation
npx hoist-docs search "grid sorting"         # Search all docs by keyword
npx hoist-docs read cmp/grid                 # Read a specific doc by ID
npx hoist-docs list                          # List all available docs
npx hoist-docs conventions                   # Print coding conventions
npx hoist-docs index                         # Print the documentation catalog

# TypeScript symbols and types
npx hoist-ts search GridModel                # Search for symbols and class members
npx hoist-ts symbol GridModel                # Get detailed type info for a symbol
npx hoist-ts members GridModel               # List all members of a class/interface
```

**Use `search` for discovery** — it does case-insensitive fuzzy matching across both symbol names
and class members. Use `symbol` and `members` only when you already know the exact PascalCase name.
Run `npx hoist-docs --help` and `npx hoist-ts --help` for full usage.
