---
aliases: 
tags:
  - cheatsheet
  - mac
---

# MacBook Storage Cleanup Cheatsheet 🧹


## Introduction 📝

This cheatsheet provides essential commands and best practices for managing storage space on your MacBook. Whether you're running low on disk space or want to maintain a clean system, you'll find quick commands, cleanup procedures, and maintenance tips. The commands are designed to be safe and effective, but always ensure you have backups before performing any cleanup operations.

### When to Use This Cheatsheet:
- Running low on storage space
- System performance is slowing down
- Regular maintenance schedule
- Before/After large file operations
- Preparing for system updates

### What's Included:
- Quick storage check commands
- Cleanup procedures
- File type searches
- Best practices
- Warning signs to watch for
- Regular maintenance Tips

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


## Quick Cleanup Commands ⚡

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

1. Click Apple Menu
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

## Quick Tips 💪

- Use `du -sh` to check folder sizes
- Keep Downloads folder organized
- Regular Time Machine backups
- Monitor system storage weekly
