"""
Migration system for handling database upgrades
"""

from database import Database
from typing import List, Dict
import os

class MigrationManager:
    def __init__(self, db: Database):
        self.db = db
        self.migrations = self._get_migrations()
    
    def _get_migrations(self) -> List[Dict]:
        """Define all migrations in order"""
        return [
            {
                "version": "1.0.0",
                "description": "Initial system setup",
                "script": ""  # Already applied during init
            },
            {
                "version": "1.1.0",
                "description": "Add member metadata fields",
                "script": """
                    ALTER TABLE members ADD COLUMN email TEXT;
                    ALTER TABLE members ADD COLUMN address TEXT;
                    ALTER TABLE members ADD COLUMN photo_url TEXT;
                """
            },
            {
                "version": "1.2.0",
                "description": "Add scan location tracking",
                "script": """
                    ALTER TABLE scan_history ADD COLUMN latitude REAL;
                    ALTER TABLE scan_history ADD COLUMN longitude REAL;
                    ALTER TABLE scan_history ADD COLUMN location_name TEXT;
                """
            },
            {
                "version": "1.3.0",
                "description": "Add gateway sync status",
                "script": """
                    ALTER TABLE gateways ADD COLUMN sync_status TEXT DEFAULT 'synced';
                    ALTER TABLE gateways ADD COLUMN pending_uploads INTEGER DEFAULT 0;
                """
            }
        ]
    
    def get_pending_migrations(self) -> List[Dict]:
        """Get migrations that haven't been applied yet"""
        current_version = self.db.get_current_version()
        version_history = self.db.get_version_history()
        applied_versions = {v['version'] for v in version_history}
        
        pending = []
        for migration in self.migrations:
            if migration['version'] not in applied_versions and migration['version'] > current_version:
                pending.append(migration)
        
        return pending
    
    def apply_migration(self, version: str) -> bool:
        """Apply a specific migration"""
        migration = next((m for m in self.migrations if m['version'] == version), None)
        
        if not migration:
            print(f"Migration {version} not found")
            return False
        
        try:
            if migration['script']:
                self.db.apply_migration(
                    version=migration['version'],
                    description=migration['description'],
                    migration_script=migration['script']
                )
                print(f"Applied migration {version}: {migration['description']}")
            return True
        except Exception as e:
            print(f"Error applying migration {version}: {e}")
            return False
    
    def apply_all_pending(self) -> Dict:
        """Apply all pending migrations"""
        pending = self.get_pending_migrations()
        
        if not pending:
            return {
                "message": "No pending migrations",
                "applied": 0,
                "failed": 0
            }
        
        applied = 0
        failed = 0
        errors = []
        
        for migration in pending:
            if self.apply_migration(migration['version']):
                applied += 1
            else:
                failed += 1
                errors.append(f"Failed to apply {migration['version']}")
        
        return {
            "message": f"Applied {applied} migrations, {failed} failed",
            "applied": applied,
            "failed": failed,
            "errors": errors
        }
    
    def get_migration_status(self) -> Dict:
        """Get current migration status"""
        current_version = self.db.get_current_version()
        pending = self.get_pending_migrations()
        history = self.db.get_version_history()
        
        return {
            "currentVersion": current_version,
            "pendingMigrations": len(pending),
            "appliedMigrations": len(history),
            "pending": [{"version": m['version'], "description": m['description']} for m in pending],
            "history": history
        }


def check_and_upgrade(db_path: str = "party_members.db") -> Dict:
    """
    Check for pending migrations and apply them
    This function should be called on system startup
    """
    db = Database(db_path)
    manager = MigrationManager(db)
    
    status = manager.get_migration_status()
    
    if status['pendingMigrations'] > 0:
        print(f"\n{'='*50}")
        print(f"SYSTEM UPGRADE AVAILABLE")
        print(f"Current Version: {status['currentVersion']}")
        print(f"Pending Migrations: {status['pendingMigrations']}")
        print(f"{'='*50}\n")
        
        for migration in status['pending']:
            print(f"  - {migration['version']}: {migration['description']}")
        
        print("\nApplying migrations...")
        result = manager.apply_all_pending()
        
        print(f"\n{result['message']}")
        if result['errors']:
            print("Errors:")
            for error in result['errors']:
                print(f"  - {error}")
        
        return result
    else:
        print(f"System is up to date (v{status['currentVersion']})")
        return {"message": "System is up to date", "applied": 0}


if __name__ == "__main__":
    # Run upgrade check
    result = check_and_upgrade()
    print("\nUpgrade check complete")
