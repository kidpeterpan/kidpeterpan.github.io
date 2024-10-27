---
aliases: 
tags:
  - cheatsheet
  - mac
---

# MacBook Storage Cleanup Cheatsheet 🧹

## Quick Storage Check Commands 🔍

```bash
# Check disk space usage
df -h

# Sort files by size (current directory)
ls -lahS

# Find large files (>500MB)
find ~/ -type f -size +500M

# Find and sort top 20 largest files/folders
du -sh ~/* | sort -rh | head -n 20
```

## Common Large File Locations 📁

### System

```ts
/Library/Caches/
~/Library/Caches/
/Library/Logs/
~/Library/Logs/
```

### Apps & Downloads

```ts
~/Downloads/
/Applications/
~/Library/Application Support/
```

### Developer

```ts
~/Library/Developer/Xcode/
~/Library/Developer/CoreSimulator/
```

### Browser

```ts
~/Library/Application Support/Google/Chrome/
~/Library/Safari/
```

## Quick Cleanup Commands ⚡

### System Cache

```bash
# Clear user cache
rm -rf ~/Library/Caches/*

# Clear system cache (needs sudo)
sudo rm -rf /Library/Caches/*
```

### Downloads

```bash
# Remove old downloads (30+ days)
find ~/Downloads -mtime +30 -delete
```

### Docker

```bash
# Clean Docker
docker system prune -a
```

### Trash

```bash
# Empty trash
rm -rf ~/.Trash/*
```

## Built-in Storage Management 🖥️

1. Click Apple Menu ()
2. About This Mac
3. Storage
4. Manage

## Large Files by Type 📊

```bash
# Find large video files
find ~/ -type f -name "*.mp4" -o -name "*.mov" -size +100M

# Find large images
find ~/ -type f -name "*.jpg" -o -name "*.png" -size +10M

# Find large zip files
find ~/ -type f -name "*.zip" -size +100M
```

## App-Specific Cleanup 🧰

### Xcode

```bash
# Clear derived data
rm -rf ~/Library/Developer/Xcode/DerivedData
```

### Node.js

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
```

### Browsers

```bash
# Chrome cache location
~/Library/Caches/Google/Chrome/Default/Cache

# Safari cache
~/Library/Caches/com.apple.Safari/WebKitCache
```

## Warning Signs ⚠️

- Low disk space alert
- System slowdown
- Time Machine backup failures
- App launch delays

## Best Practices 💡

1. Regular cleanup schedule
   - Daily: Empty trash
   - Weekly: Clear downloads
   - Monthly: System cache cleanup

2. Before Cleanup:
   - Backup important data
   - Check what you're deleting
   - Use secure deletion for sensitive data

3. After Cleanup:
   - Verify system functionality
   - Check available space
   - Update cleanup schedule if needed

## Tools 🛠️

- DaisyDisk
- OmniDiskSweeper
- CleanMyMac X
- AppCleaner

## Quick Tips 💪

- Use `du -sh` to check folder sizes
- Keep Downloads folder organized
- Regular Time Machine backups
- Monitor system storage weekly