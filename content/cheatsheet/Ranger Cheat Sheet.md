# Ranger File Manager Cheat Sheet

## Basic Navigation

| Command | Description |
|---------|-------------|
| `h` | Move to parent directory |
| `j` | Move down (next file) |
| `k` | Move up (previous file) |
| `l` | Open file or enter directory |
| `gg` | Go to top of list |
| `G` | Go to bottom of list |
| `H` | Go back in history |
| `L` | Go forward in history |
| `~` | Go to home directory |
| `/` | Search for files |
| `n` | Next search result |
| `N` | Previous search result |
| `f` | Find (quick search) |

## File Operations

| Command | Description |
|---------|-------------|
| `<Space>` | Select current file |
| `v` | Visual selection mode |
| `uv` | Deselect all |
| `yy` | Yank (copy) file |
| `dd` | Cut file |
| `pp` | Paste file |
| `cw` | Rename current file |
| `:rename` | Rename with editor |
| `I` | Rename without extension |
| `A` | Rename at the end |
| `a` | Rename at the end without extension |
| `:bulkrename` | Bulk rename selected files |
| `<Delete>` | Delete selected files |
| `dD` | Delete selected files (no confirmation) |
| `chmod` | Change file permissions |

## File Creation & Editing

| Command | Description |
|---------|-------------|
| `:touch` | Create a new file |
| `:mkdir` | Create a new directory |
| `o` | Sort options |
| `z` | Change settings |
| `i` | Show file (preview) |
| `E` | Edit file in $EDITOR |
| `S` | Open shell in current directory |
| `!` | Execute shell command |
| `@` | Execute shell command with file names |

## Tab Management

| Command | Description |
|---------|-------------|
| `<Ctrl>n` | Create new tab |
| `<Ctrl>w` | Close current tab |
| `<Tab>` | Next tab |
| `<Shift><Tab>` | Previous tab |
| `<Alt>1-9` | Go to tab 1-9 |

## Bookmarks

| Command | Description |
|---------|-------------|
| `m + <key>` | Create bookmark with key |
| `' + <key>` | Go to bookmark with key |
| `um + <key>` | Delete bookmark |

## Views & Display

| Command | Description |
|---------|-------------|
| `zh` | Show hidden files |
| `zp` | Toggle preview |
| `zP` | Toggle full-screen preview |
| `zf` | Filter files by pattern |
| `M` | Show linemode selector |
| `<Ctrl>h` | Toggle hidden files |
| `dc` | Calculate directory size |
| `zc` | Toggle collapse preview |
| `?` | Show help / key bindings |

## Advanced Features

| Command | Description |
|---------|-------------|
| `:flat` | Flatten directory view |
| `:filter` | Filter files by pattern |
| `:find` | Find files by pattern |
| `:locate` | Find files using locate command |
| `:shell` | Open shell in current directory |
| `:terminal` | Open terminal in current directory |
| `W` | Open dedicated message window |
| `:help` | Show help document |
| `:cd` | Change directory |
| `:scout` | Execute ranger's file selector |

## Custom Commands
You can define custom commands in your `~/.config/ranger/commands.py` file.

## Configuration
Your configuration files are located in `~/.config/ranger/`:
- `rc.conf`: Main configuration file
- `rifle.conf`: File opener configuration
- `commands.py`: Custom commands
- `scope.sh`: File previewer configuration
