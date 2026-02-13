# QR-Based Party Member Identification System
## Offline Local System with Multiple Gateway Support

## Overview
This system is designed to identify and track attendance/participation of party members using QR codes in an **offline local environment** with support for **multiple gateways**.

### Key Features
- **Offline Local System**: SQLite database for reliable offline operation
- **Multiple Gateway Support**: Manage up to 10 deployed systems/gateways
- **Upload Date Tracking**: Track when member data was uploaded to each gateway
- **Scan Validation**: Validate scans based on upload date (members must be uploaded before scanning)
- **Upgrade Handling**: Automatic database migration system for version upgrades
- **Upload History**: Complete audit trail of all data uploads
- **Gateway Management**: Register, monitor, and sync multiple gateways

## Technology Stack
- **Frontend**: React (Vite) with modern UI
- **Backend**: Python (FastAPI)
- **Database**: SQLite (offline local storage)
- **QR Code**: Camera-based scanning

## System Architecture

### Database Schema
The system uses SQLite with the following tables:
- `members` - Member information with upload date tracking
- `gateways` - Gateway registration and configuration
- `scan_history` - Complete scan audit trail
- `upload_batches` - Upload tracking and history
- `version_history` - System version and migration tracking
- `system_config` - System configuration

### Gateway System
Each gateway represents a deployed instance of the system. Features include:
- Unique gateway ID (e.g., GATEWAY-001, GATEWAY-002)
- Gateway name and location
- Active/inactive status
- Last sync timestamp
- Independent member databases per gateway

### Upload Date Validation
The system validates scans based on upload date:
1. Member data is uploaded with a timestamp
2. Scans are only valid if the member was uploaded **before** the scan time
3. This prevents scanning members who haven't been registered yet
4. Provides data integrity and audit compliance

### Data Synchronization Between Gateways
Since gateways operate offline, data synchronization is done manually:

#### **Recommended: Excel-Based Sync** ⭐
The easiest method for non-technical users:
1. Download database as Excel from any gateway (Admin → Download Database)
2. Upload the Excel file to other gateways (Admin → Upload)
3. Each gateway maintains its own scan history
4. See `SIMPLE_DEPLOYMENT.md` for step-by-step guide

**Benefits**:
- ✅ No technical knowledge required
- ✅ Works while system is running
- ✅ Safe - doesn't overwrite scan history
- ✅ Visual - can edit in Excel
- ✅ Familiar to everyone


## Setup Instructions

### Prerequisites
- Node.js & npm
- Python 3.8+

### Installation

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd client
   npm install
   ```

### Running the Application

From the root directory, run:
```bash
npm start
```

This will start both:
- **Backend**: `http://localhost:8000`
- **Frontend**: `http://localhost:5173`

The database will be automatically created at `backend/party_members.db` on first run.

## Usage Guide

### 1. Gateway Management

#### Register a New Gateway
1. Navigate to **Gateway Manager** page
2. Click **Add Gateway**
3. Enter:
   - Gateway ID (e.g., GATEWAY-002)
   - Gateway Name (e.g., "North Zone Gateway")
   - Location (optional)
4. Click **Register**

#### View Gateway Status
- View all registered gateways
- Check active/inactive status
- See last sync time
- Monitor gateway statistics

### 2. Admin Panel

#### Select Gateway
- Use the gateway selector dropdown to choose which gateway to manage
- All operations (upload, stats, history) are scoped to the selected gateway

#### Upload Member Data
1. Select the target gateway
2. Click **Select Excel File**
3. Choose your Excel file with required columns:
   - `Name` (required)
   - `QR Code ID` (required)
   - `Designation` (optional)
   - `Constituency` (optional)
   - `Constituency Number` (optional)
   - `Mobile Number` (optional)
4. Click **Confirm Upload**
5. Review upload results:
   - Total records processed
   - Successful imports
   - Failed imports with error details

#### View Upload History
- Click **Show History** to view all past uploads
- See batch ID, file name, upload date, and statistics
- Track data lineage and audit trail

#### View Member Statistics
- Total members in selected gateway
- Members scanned today
- Complete member list with:
  - Upload date
  - Last scan time
  - Total scan count

### 3. Scanner

#### Scan QR Codes
1. Select the gateway you're scanning for
2. Allow camera access
3. Point camera at QR code
4. System validates:
   - Member exists in database
   - Member was uploaded before scan time
   - No duplicate scan within 1 hour
5. View scan result:
   - Member details
   - Validation status
   - Daily scan count

### 4. Statistics Dashboard
- View overall system statistics
- Filter by gateway
- See scan trends
- Monitor system health

## System Upgrades

### Automatic Migration
The system includes an automatic migration system for database upgrades:

1. **Check for pending migrations:**
   ```bash
   cd backend
   python migrations.py
   ```

2. **Migrations are applied automatically on startup**
   - System checks for pending migrations
   - Applies them in order
   - Updates version history
   - No data loss

### Version History
View version history via API:
```
GET /api/version
```

Response includes:
- Current system version
- All applied migrations
- Migration timestamps

## API Endpoints

### Gateway Management
- `GET /api/gateways` - Get all gateways
- `GET /api/gateways/active` - Get active gateways
- `POST /api/gateways/register` - Register new gateway
- `POST /api/gateways/{gateway_id}/sync` - Update sync timestamp

### Member Management
- `POST /api/upload?gatewayId={id}` - Upload member data
- `GET /api/upload/history?gatewayId={id}` - Get upload history
- `GET /api/stats?gatewayId={id}` - Get statistics
- `GET /api/download` - Download database as Excel

### Scanning
- `POST /api/scan` - Scan QR code with validation
  ```json
  {
    "qrId": "MEMBER-001",
    "gatewayId": "GATEWAY-001"
  }
  ```

### System
- `GET /api/health` - System health check
- `GET /api/version` - Version information
- `GET /api/config` - System configuration
- `POST /api/config` - Update configuration

## Data Validation Rules

### Upload Validation
- QR Code ID must be unique
- Name is required
- Duplicate QR codes are rejected
- Upload date is automatically recorded

### Scan Validation
1. **Member Exists**: QR code must exist in database
2. **Upload Date Check**: Member must be uploaded before scan time
3. **Duplicate Prevention**: Maximum 1 scan per hour
4. **Gateway Match**: Scan is recorded for specific gateway

## Offline Operation

### Local Database
- All data stored in SQLite database
- No internet connection required
- Fast local queries
- Reliable offline operation

### Data Backup
- Download database as Excel anytime
- Includes all member data and scan history
- Timestamped backup files

## Deployment for 10 Systems

### Setup Process
1. Install system on each device/location
2. Register unique gateway for each:
   - GATEWAY-001 (Headquarters)
   - GATEWAY-002 (North Zone)
   - GATEWAY-003 (South Zone)
   - ... up to GATEWAY-010
3. Upload member data to each gateway
4. Each system operates independently offline

### Data Synchronization (Optional)
For future enhancement, gateways can sync data:
- Export from one gateway
- Import to another gateway
- Merge scan histories
- Maintain data consistency

## Troubleshooting

### Database Issues
If database gets corrupted:
```bash
cd backend
rm party_members.db
python -c "from database import Database; Database()"
```

### Migration Issues
To reset migrations:
```bash
cd backend
python migrations.py
```

### Gateway Issues
- Ensure gateway is registered before use
- Check gateway is active
- Verify gateway ID matches

## Security Considerations

### Data Privacy
- All data stored locally
- No external data transmission
- Offline operation ensures privacy

### Access Control
- Admin panel for authorized users only
- Scanner can be public-facing
- Consider implementing authentication for production

## Future Enhancements

### Planned Features
1. **Gateway Synchronization**: Automatic sync between gateways
2. **Offline-First Sync**: Queue operations when offline, sync when online
3. **Advanced Analytics**: Detailed reports and visualizations
4. **Export Formats**: PDF, CSV export options
5. **Bulk Operations**: Bulk member updates and deletions
6. **User Authentication**: Role-based access control
7. **Mobile App**: Native mobile scanner app

## Support

For issues or questions:
1. Check this README
2. Review API documentation
3. Check database schema
4. Review migration history

## License
ISC

## Version
Current Version: 1.0.0

### Changelog
- **1.0.0** (2026-02-13)
  - Initial release with offline local system
  - Multiple gateway support
  - Upload date tracking
  - Scan validation based on upload date
  - Automatic migration system
  - Upload history tracking
