#!/bin/bash
# Database Backup Script
# Uses Supabase CLI to export database to SQL file

set -e

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/pickle-tourney_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting database backup..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install with: npm install -g supabase"
    exit 1
fi

# Backup database using Supabase CLI
supabase db dump -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully!"
    echo "📁 File: $BACKUP_FILE"
    echo "📊 Size: $(du -h "$BACKUP_FILE" | cut -f1)"
    
    # Compress backup
    gzip "$BACKUP_FILE"
    echo "🗜️  Compressed: ${BACKUP_FILE}.gz"
    
    # Delete backups older than 30 days
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
    echo "🧹 Cleaned up backups older than 30 days"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Example cron entry (run daily at 2 AM):
# 0 2 * * * /path/to/scripts/backup_db.sh >> /path/to/logs/backup.log 2>&1

