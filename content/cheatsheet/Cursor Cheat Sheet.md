### Essential keyboard shortcuts for Mac productivity

Master these core Mac shortcuts to maximize efficiency:
- **⌘+K**: Inline code editing and generation (primary Mac shortcut)
- **⌘+I**: Open Composer/Agent mode for multi-file operations
- **⌘+⇧+P**: Command palette (VS Code compatibility)
- **⌘+J**: Toggle terminal panel (essential for Mac workflow)
- **⌘+B**: Toggle sidebar (maximize screen real estate)
- **⌘+⇧+E**: Explorer view (file navigation)
- **⌘+T**: Quick file open (Git-aware fuzzy search)

## Codebase Indexing

ref: https://docs.cursor.com/context/codebase-indexing
- `.cursorignore`

```
# Dependencies
node_modules/
.pnpm-store/
vendor/

# Build outputs
dist/
build/
.next/
target/

# Generated files
*.generated.*
__pycache__/
.cache/
```

## Next-generation project rules system

ref: https://docs.cursor.com/context/rules

The evolution from `.cursorrules` to `.cursor/rules/` for effective & maintainable

### Hierarchical rule architecture

```
project/
├── .cursor/rules/          # Project-wide rules
│   ├── architecture.mdc
│   ├── security.mdc
│   └── backend/
│       └── .cursor/rules/  # Backend-specific rules
└── frontend/
    └── .cursor/rules/      # Frontend-specific rules
```

### Enterprise-grade rule configuration

```markdown
---
description: Enterprise API Standards
globs: ["api/**/*.ts", "services/**/*.ts"]
alwaysApply: true
---

# Security Requirements
- All endpoints require authentication middleware
- Input validation using Joi schemas
- Rate limiting on all public endpoints
- Comprehensive error logging

# Architecture Patterns
- Service layer separation
- Repository pattern for data access
- Dependency injection for testability
- OpenAPI documentation for all endpoints

@security-middleware.ts
@api-response-types.ts
@test-utilities.ts
```

### Memory Optimization

```json
{
  "files.watcherExclude": {
    "**/.DS_Store": true,
    "**/._*": true,
    "**/.Spotlight-V100": true,
    "**/.fseventsd": true,
    "**/.Trashes": true,
    "**/node_modules/**": true,
    "**/.git/**": true,
    "**/build/**": true,
    "**/.next/**": true
  },
}
```

## Advanced prompt engineering techniques

- 

### Security and Privacy foundation

```json
{
  "cursor.ai.shareContext": "workspace-only",
  "cursor.ai.excludePatterns": [
    "**/.env*", "**/secrets/**", "**/*.key", 
    "**/private/**", "**/.aws/**", "**/.ssh/**",
    "**/Keychain/**", "**/*.p12", "**/*.mobileprovision"
  ],
  "cursor.ai.anonymizeCode": true,
  "cursor.ai.privacyMode": true,
  "security.workspace.trust.enabled": true,
  "security.workspace.trust.emptyWindow": false
}
```

## Agent mode 

ref: https://docs.cursor.com/chat/agent#yolo-mode

Agent Mode represents Cursor's most advanced feature, enabling **autonomous task completion** with minimal human guidance. **YOLO Mode** allows controlled autonomous operation with permission systems.

### Mac-specific YOLO mode configuration

```json
{
  "cursor.agent.yoloMode": true,
  "cursor.agent.allowList": [
    "npm test", "npm run build", "yarn test", "pnpm test",
    "git status", "git log --oneline", "git diff",
    "vitest", "jest", "pytest", "cargo test",
    "swift test", "xcodebuild test", "pod install",
    "brew install", "brew update", "brew list",
    "ls -la", "find . -name", "grep -r"
  ],
  "cursor.agent.denyList": [
    "rm -rf", "sudo rm", "format", "delete",
    "sudo shutdown", "sudo reboot", "killall",
    "launchctl unload", "diskutil erase"
  ],
  "cursor.agent.autoApplyEdits": true,
  "cursor.agent.autoExecuteCommands": false,
  "cursor.agent.allowedPaths": [
    "~/Developer", "~/Projects", "~/Documents/Code"
  ]
}
```

## Demo

Goto: https://github.com/kidpeterpan/cursor-101

🚀 Quick Setup Instructions:

Save the script to your Wails project root
Make it executable:

`bash# chmod +x setup-cursor.sh`

Run the setup:
`bash# ./setup-cursor.sh`
