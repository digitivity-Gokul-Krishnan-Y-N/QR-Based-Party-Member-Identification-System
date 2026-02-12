
# QR-Based Party Member Identification System

## Overview
This system is designed to identify and track attendance/participation of party members using QR codes.
- **Frontend**: React (Vite)
- **Backend**: Python (FastAPI) [Changed from Node.js]
- **Database**: Excel (.xlsx) file managed locally.

## Features
1. **Admin Panel**: Upload Excel database, view live stats.
2. **Scanner**: Use camera to scan member QR codes.
3. **Validation**: Check valid member, check duplicate scans (once per day).
4. **Stats**: Live count of total members and daily scans.

## Setup Instructions

### Prerequisites
- Node.js & npm
- Python 3.8+

### Installation
1. Install root dependencies:
   ```bash
   npm install
   ```

2. Install Backend Dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
   *Note: If `pip` is not in PATH, use `python -m pip`.*

3. Install Frontend Dependencies:
   ```bash
   cd client
   npm install
   ```
   *(Create-Vite setup already did this)*

### Running the Application
From the root directory, run:
```bash
npm start
```
This will start both:
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`

## Usage
1. Open the frontend URL.
2. Go to **Admin** page to upload your member list (Excel). 
   - Required columns: `Name`, `QR Code ID`.
3. Go to **Scan** page to start scanning QR codes.
