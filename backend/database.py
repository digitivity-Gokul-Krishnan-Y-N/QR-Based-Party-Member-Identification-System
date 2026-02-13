"""
Database module for QR-Based Party Member Identification System
Handles SQLite database operations for offline local system
"""

import sqlite3
import os
from datetime import datetime
from typing import List, Dict, Optional, Tuple
import json

class Database:
    def __init__(self, db_path: str = "party_members.db"):
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_database(self):
        """Initialize database with required tables"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # System configuration table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS system_config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                config_key TEXT UNIQUE NOT NULL,
                config_value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Gateway configuration table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS gateways (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                gateway_id TEXT UNIQUE NOT NULL,
                gateway_name TEXT NOT NULL,
                location TEXT,
                is_active BOOLEAN DEFAULT 1,
                last_sync_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Members table with upload tracking
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                qr_code_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                designation TEXT,
                constituency TEXT,
                constituency_number TEXT,
                mobile_number TEXT,
                upload_date TIMESTAMP NOT NULL,
                upload_batch_id TEXT,
                gateway_id TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (gateway_id) REFERENCES gateways(gateway_id)
            )
        """)
        
        # Scan history table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scan_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                qr_code_id TEXT NOT NULL,
                member_id INTEGER NOT NULL,
                gateway_id TEXT NOT NULL,
                scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                scan_date DATE NOT NULL,
                is_valid BOOLEAN DEFAULT 1,
                validation_message TEXT,
                FOREIGN KEY (member_id) REFERENCES members(id),
                FOREIGN KEY (gateway_id) REFERENCES gateways(gateway_id)
            )
        """)
        
        # Upload batches table for tracking data uploads
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS upload_batches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                batch_id TEXT UNIQUE NOT NULL,
                gateway_id TEXT NOT NULL,
                file_name TEXT,
                total_records INTEGER DEFAULT 0,
                successful_records INTEGER DEFAULT 0,
                failed_records INTEGER DEFAULT 0,
                upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                uploaded_by TEXT,
                status TEXT DEFAULT 'completed',
                FOREIGN KEY (gateway_id) REFERENCES gateways(gateway_id)
            )
        """)
        
        # Version tracking for upgrades
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS version_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version TEXT NOT NULL,
                description TEXT,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                migration_script TEXT
            )
        """)
        
        # Create indexes for better performance
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_members_qr_code ON members(qr_code_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_members_upload_date ON members(upload_date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_scan_history_date ON scan_history(scan_date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_scan_history_member ON scan_history(member_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_scan_history_gateway ON scan_history(gateway_id)")
        
        # Insert default system version
        cursor.execute("""
            INSERT OR IGNORE INTO system_config (config_key, config_value)
            VALUES ('system_version', '1.0.0')
        """)
        
        # Insert default gateway if none exists
        cursor.execute("SELECT COUNT(*) as count FROM gateways")
        if cursor.fetchone()['count'] == 0:
            cursor.execute("""
                INSERT INTO gateways (gateway_id, gateway_name, location, is_active)
                VALUES ('GATEWAY-001', 'Main Gateway', 'Headquarters', 1)
            """)
        
        # Insert initial version record
        cursor.execute("SELECT COUNT(*) as count FROM version_history")
        if cursor.fetchone()['count'] == 0:
            cursor.execute("""
                INSERT INTO version_history (version, description)
                VALUES ('1.0.0', 'Initial system setup with offline local database')
            """)
        
        conn.commit()
        conn.close()
    
    def get_system_config(self, key: str) -> Optional[str]:
        """Get system configuration value"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT config_value FROM system_config WHERE config_key = ?", (key,))
        result = cursor.fetchone()
        conn.close()
        return result['config_value'] if result else None
    
    def set_system_config(self, key: str, value: str):
        """Set system configuration value"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO system_config (config_key, config_value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
        """, (key, value))
        conn.commit()
        conn.close()
    
    def register_gateway(self, gateway_id: str, gateway_name: str, location: str = "") -> bool:
        """Register a new gateway"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO gateways (gateway_id, gateway_name, location, is_active)
                VALUES (?, ?, ?, 1)
            """, (gateway_id, gateway_name, location))
            conn.commit()
            conn.close()
            return True
        except sqlite3.IntegrityError:
            return False
    
    def get_all_gateways(self) -> List[Dict]:
        """Get all registered gateways"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM gateways ORDER BY created_at DESC")
        gateways = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return gateways
    
    def get_active_gateways(self) -> List[Dict]:
        """Get all active gateways"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM gateways WHERE is_active = 1 ORDER BY created_at DESC")
        gateways = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return gateways
    
    def update_gateway_sync(self, gateway_id: str):
        """Update gateway last sync timestamp"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE gateways 
            SET last_sync_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE gateway_id = ?
        """, (gateway_id,))
        conn.commit()
        conn.close()
    
    def add_member(self, qr_code_id: str, name: str, designation: str = "", 
                   constituency: str = "", constituency_number: str = "",
                   mobile_number: str = "", gateway_id: str = "GATEWAY-001",
                   upload_batch_id: str = None) -> Tuple[bool, str]:
        """Add a new member with upload date tracking"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            upload_date = datetime.now()
            
            cursor.execute("""
                INSERT INTO members (
                    qr_code_id, name, designation, constituency, 
                    constituency_number, mobile_number, upload_date,
                    upload_batch_id, gateway_id
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (qr_code_id, name, designation, constituency, 
                  constituency_number, mobile_number, upload_date,
                  upload_batch_id, gateway_id))
            
            conn.commit()
            conn.close()
            return True, "Member added successfully"
        except sqlite3.IntegrityError:
            return False, f"Member with QR Code ID {qr_code_id} already exists"
        except Exception as e:
            return False, str(e)
    
    def get_member_by_qr(self, qr_code_id: str) -> Optional[Dict]:
        """Get member by QR code ID"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM members 
            WHERE qr_code_id = ? AND is_active = 1
        """, (qr_code_id,))
        member = cursor.fetchone()
        conn.close()
        return dict(member) if member else None
    
    def validate_scan(self, qr_code_id: str, gateway_id: str) -> Tuple[bool, str, Optional[Dict]]:
        """
        Validate scan based on upload date
        Returns: (is_valid, message, member_data)
        """
        member = self.get_member_by_qr(qr_code_id)
        
        if not member:
            return False, "Member not found in database", None
        
        # Check if member was uploaded before current time
        upload_date = datetime.fromisoformat(member['upload_date'])
        current_time = datetime.now()
        
        if upload_date > current_time:
            return False, "Invalid: Member data uploaded in future", member
        
        # Check for duplicate scans today
        conn = self.get_connection()
        cursor = conn.cursor()
        today = datetime.now().date()
        
        cursor.execute("""
            SELECT * FROM scan_history 
            WHERE member_id = ? AND scan_date = ? AND gateway_id = ?
            ORDER BY scanned_at DESC LIMIT 1
        """, (member['id'], today, gateway_id))
        
        last_scan = cursor.fetchone()
        conn.close()
        
        if last_scan:
            last_scan_time = datetime.fromisoformat(last_scan['scanned_at'])
            time_diff = (current_time - last_scan_time).total_seconds() / 60
            
            if time_diff < 60:  # Less than 1 hour
                remaining = int(60 - time_diff)
                return False, f"Already scanned. Wait {remaining} more minutes", member
        
        return True, "Valid scan", member
    
    def record_scan(self, qr_code_id: str, member_id: int, gateway_id: str, 
                    is_valid: bool, validation_message: str) -> bool:
        """Record a scan in history"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            scan_date = datetime.now().date()
            
            cursor.execute("""
                INSERT INTO scan_history (
                    qr_code_id, member_id, gateway_id, scan_date,
                    is_valid, validation_message
                )
                VALUES (?, ?, ?, ?, ?, ?)
            """, (qr_code_id, member_id, gateway_id, scan_date, 
                  is_valid, validation_message))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error recording scan: {e}")
            return False
    
    def get_stats(self, gateway_id: str = None) -> Dict:
        """Get system statistics"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Total members
        if gateway_id:
            cursor.execute("SELECT COUNT(*) as count FROM members WHERE gateway_id = ? AND is_active = 1", (gateway_id,))
        else:
            cursor.execute("SELECT COUNT(*) as count FROM members WHERE is_active = 1")
        total_members = cursor.fetchone()['count']
        
        # Scanned today
        today = datetime.now().date()
        if gateway_id:
            cursor.execute("""
                SELECT COUNT(DISTINCT member_id) as count 
                FROM scan_history 
                WHERE scan_date = ? AND gateway_id = ? AND is_valid = 1
            """, (today, gateway_id))
        else:
            cursor.execute("""
                SELECT COUNT(DISTINCT member_id) as count 
                FROM scan_history 
                WHERE scan_date = ? AND is_valid = 1
            """, (today,))
        scanned_today = cursor.fetchone()['count']
        
        # Get all members with scan info
        if gateway_id:
            cursor.execute("""
                SELECT m.*, 
                       (SELECT COUNT(*) FROM scan_history WHERE member_id = m.id AND is_valid = 1) as scan_count,
                       (SELECT scanned_at FROM scan_history WHERE member_id = m.id AND is_valid = 1 ORDER BY scanned_at DESC LIMIT 1) as last_scanned_at
                FROM members m
                WHERE m.gateway_id = ? AND m.is_active = 1
                ORDER BY m.created_at DESC
            """, (gateway_id,))
        else:
            cursor.execute("""
                SELECT m.*, 
                       (SELECT COUNT(*) FROM scan_history WHERE member_id = m.id AND is_valid = 1) as scan_count,
                       (SELECT scanned_at FROM scan_history WHERE member_id = m.id AND is_valid = 1 ORDER BY scanned_at DESC LIMIT 1) as last_scanned_at
                FROM members m
                WHERE m.is_active = 1
                ORDER BY m.created_at DESC
            """)
        
        members = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return {
            "totalMembers": total_members,
            "scannedToday": scanned_today,
            "members": members
        }
    
    def create_upload_batch(self, gateway_id: str, file_name: str, 
                           uploaded_by: str = "admin") -> str:
        """Create a new upload batch and return batch_id"""
        batch_id = f"BATCH-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO upload_batches (batch_id, gateway_id, file_name, uploaded_by)
            VALUES (?, ?, ?, ?)
        """, (batch_id, gateway_id, file_name, uploaded_by))
        conn.commit()
        conn.close()
        
        return batch_id
    
    def update_upload_batch(self, batch_id: str, total: int, successful: int, failed: int):
        """Update upload batch statistics"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE upload_batches 
            SET total_records = ?, successful_records = ?, failed_records = ?
            WHERE batch_id = ?
        """, (total, successful, failed, batch_id))
        conn.commit()
        conn.close()
    
    def get_upload_history(self, gateway_id: str = None) -> List[Dict]:
        """Get upload history"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if gateway_id:
            cursor.execute("""
                SELECT * FROM upload_batches 
                WHERE gateway_id = ?
                ORDER BY upload_date DESC
            """, (gateway_id,))
        else:
            cursor.execute("SELECT * FROM upload_batches ORDER BY upload_date DESC")
        
        batches = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return batches
    
    def apply_migration(self, version: str, description: str, migration_script: str):
        """Apply database migration"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Execute migration script
        cursor.executescript(migration_script)
        
        # Record migration
        cursor.execute("""
            INSERT INTO version_history (version, description, migration_script)
            VALUES (?, ?, ?)
        """, (version, description, migration_script))
        
        # Update system version
        cursor.execute("""
            UPDATE system_config 
            SET config_value = ?, updated_at = CURRENT_TIMESTAMP
            WHERE config_key = 'system_version'
        """, (version,))
        
        conn.commit()
        conn.close()
    
    def get_current_version(self) -> str:
        """Get current system version"""
        return self.get_system_config('system_version') or '1.0.0'
    
    def get_version_history(self) -> List[Dict]:
        """Get version history"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM version_history ORDER BY applied_at DESC")
        versions = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return versions
