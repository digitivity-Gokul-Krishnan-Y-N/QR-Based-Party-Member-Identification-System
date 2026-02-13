
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import os
from datetime import datetime
from typing import Optional
from database import Database

app = FastAPI(title="QR Party Member Identification System - Offline Local")

# Allow CORS since Vite runs on a different port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
DB_PATH = os.path.join(BASE_DIR, "party_members.db")

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# Initialize Database
db = Database(DB_PATH)

# Models
class ScanRequest(BaseModel):
    qrId: str
    gatewayId: Optional[str] = "GATEWAY-001"

class GatewayRegistration(BaseModel):
    gatewayId: str
    gatewayName: str
    location: Optional[str] = ""

class SystemConfig(BaseModel):
    key: str
    value: str

# Routes

@app.get("/")
async def root():
    version = db.get_current_version()
    return {
        "message": "QR Party Member API - Offline Local System", 
        "status": "ok",
        "version": version,
        "database": "SQLite"
    }

@app.get("/api/health")
async def health_check():
    version = db.get_current_version()
    gateways = db.get_active_gateways()
    return {
        "status": "healthy", 
        "database": os.path.exists(DB_PATH),
        "version": version,
        "activeGateways": len(gateways)
    }

@app.get("/api/version")
async def get_version():
    """Get current system version and history"""
    current_version = db.get_current_version()
    version_history = db.get_version_history()
    return {
        "currentVersion": current_version,
        "history": version_history
    }

@app.get("/api/gateways")
async def get_gateways():
    """Get all registered gateways"""
    gateways = db.get_all_gateways()
    return {"gateways": gateways}

@app.get("/api/gateways/active")
async def get_active_gateways():
    """Get all active gateways"""
    gateways = db.get_active_gateways()
    return {"gateways": gateways}

@app.post("/api/gateways/register")
async def register_gateway(gateway: GatewayRegistration):
    """Register a new gateway"""
    success = db.register_gateway(
        gateway.gatewayId, 
        gateway.gatewayName, 
        gateway.location or ""
    )
    
    if success:
        return {"message": "Gateway registered successfully", "gatewayId": gateway.gatewayId}
    else:
        raise HTTPException(status_code=400, detail="Gateway already exists")

@app.post("/api/gateways/{gateway_id}/sync")
async def sync_gateway(gateway_id: str):
    """Update gateway sync timestamp"""
    db.update_gateway_sync(gateway_id)
    return {"message": "Gateway sync updated", "gatewayId": gateway_id}

@app.post("/api/upload")
async def upload_excel(
    file: UploadFile = File(...),
    gatewayId: str = Query(default="GATEWAY-001")
):
    """Upload Excel file and import members with upload date tracking"""
    try:
        # Save uploaded file temporarily
        temp_file = os.path.join(UPLOAD_DIR, f"temp_{datetime.now().strftime('%Y%m%d%H%M%S')}.xlsx")
        with open(temp_file, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Read Excel file
        df = pd.read_excel(temp_file)
        
        # Verify required columns
        required_cols = {'Name', 'QR Code ID'}
        if not required_cols.issubset(df.columns):
            os.remove(temp_file)
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns. Required: {required_cols}"
            )
        
        # Create upload batch
        batch_id = db.create_upload_batch(gatewayId, file.filename)
        
        # Import members
        total = len(df)
        successful = 0
        failed = 0
        errors = []
        
        for idx, row in df.iterrows():
            qr_code_id = str(row.get('QR Code ID', '')).strip()
            name = str(row.get('Name', '')).strip()
            
            if not qr_code_id or not name:
                failed += 1
                errors.append(f"Row {idx + 2}: Missing QR Code ID or Name")
                continue
            
            designation = str(row.get('Designation', '')).strip()
            constituency = str(row.get('Constituency', '')).strip()
            constituency_number = str(row.get('Constituency Number', '')).strip()
            mobile_number = str(row.get('Mobile Number', '')).strip()
            
            success, message = db.add_member(
                qr_code_id=qr_code_id,
                name=name,
                designation=designation,
                constituency=constituency,
                constituency_number=constituency_number,
                mobile_number=mobile_number,
                gateway_id=gatewayId,
                upload_batch_id=batch_id
            )
            
            if success:
                successful += 1
            else:
                failed += 1
                errors.append(f"Row {idx + 2}: {message}")
        
        # Update batch statistics
        db.update_upload_batch(batch_id, total, successful, failed)
        
        # Clean up temp file
        os.remove(temp_file)
        
        # Update gateway sync
        db.update_gateway_sync(gatewayId)
        
        return {
            "message": "Upload completed",
            "batchId": batch_id,
            "total": total,
            "successful": successful,
            "failed": failed,
            "errors": errors[:10] if errors else [],  # Return first 10 errors
            "uploadDate": datetime.now().isoformat()
        }
        
    except Exception as e:
        if os.path.exists(temp_file):
            os.remove(temp_file)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/upload/history")
async def get_upload_history(gatewayId: Optional[str] = None):
    """Get upload history"""
    history = db.get_upload_history(gatewayId)
    return {"history": history}

@app.post("/api/scan")
async def scan_qr(request: ScanRequest):
    """
    Scan QR code with validation based on upload date
    Only allows scans for members uploaded before scan time
    """
    qr_id = request.qrId.strip()
    gateway_id = request.gatewayId or "GATEWAY-001"
    
    if not qr_id:
        raise HTTPException(status_code=400, detail="QR ID required")
    
    # Validate scan
    is_valid, message, member = db.validate_scan(qr_id, gateway_id)
    
    if not member:
        raise HTTPException(status_code=404, detail=message)
    
    # Record scan (both valid and invalid)
    db.record_scan(
        qr_code_id=qr_id,
        member_id=member['id'],
        gateway_id=gateway_id,
        is_valid=is_valid,
        validation_message=message
    )
    
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    # Get updated stats
    stats = db.get_stats(gateway_id)
    
    # Format member data for response
    member_response = {
        "Name": member['name'],
        "Designation": member['designation'],
        "Constituency": member['constituency'],
        "Constituency Number": member['constituency_number'],
        "Mobile Number": member['mobile_number'],
        "QR Code ID": member['qr_code_id'],
        "Upload Date": member['upload_date'],
        "Gateway ID": member['gateway_id'],
        "Scan Count": member.get('scan_count', 0) + 1,
        "Last Scanned At": datetime.now().isoformat()
    }
    
    return {
        "success": True,
        "member": member_response,
        "globalCount": stats['scannedToday'],
        "validationMessage": message
    }

@app.get("/api/stats")
async def get_stats(gatewayId: Optional[str] = None):
    """Get statistics for specific gateway or all gateways"""
    stats = db.get_stats(gatewayId)
    
    # Format members for frontend
    members_formatted = []
    for member in stats['members']:
        members_formatted.append({
            "Name": member['name'],
            "Designation": member['designation'],
            "Constituency": member['constituency'],
            "QR Code ID": member['qr_code_id'],
            "Upload Date": member['upload_date'],
            "Last Scanned At": member.get('last_scanned_at', ''),
            "Scan Count": member.get('scan_count', 0),
            "Gateway ID": member['gateway_id']
        })
    
    return {
        "totalMembers": stats['totalMembers'],
        "scannedToday": stats['scannedToday'],
        "members": members_formatted
    }

@app.get("/api/download")
async def download_db():
    """Download current database as Excel file"""
    try:
        stats = db.get_stats()
        members = stats['members']
        
        # Convert to DataFrame
        df_data = []
        for member in members:
            df_data.append({
                "Name": member['name'],
                "Designation": member['designation'],
                "Constituency": member['constituency'],
                "Constituency Number": member['constituency_number'],
                "Mobile Number": member['mobile_number'],
                "QR Code ID": member['qr_code_id'],
                "Upload Date": member['upload_date'],
                "Gateway ID": member['gateway_id'],
                "Last Scanned At": member.get('last_scanned_at', ''),
                "Scan Count": member.get('scan_count', 0)
            })
        
        df = pd.DataFrame(df_data)
        
        # Save to Excel
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"members_db_{timestamp}.xlsx"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        df.to_excel(filepath, index=False)
        
        return FileResponse(
            filepath, 
            filename=filename, 
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/config")
async def get_config():
    """Get system configuration"""
    version = db.get_current_version()
    gateways = db.get_active_gateways()
    
    return {
        "version": version,
        "gateways": gateways,
        "databaseType": "SQLite",
        "offlineMode": True
    }

@app.post("/api/config")
async def set_config(config: SystemConfig):
    """Set system configuration"""
    db.set_system_config(config.key, config.value)
    return {"message": "Configuration updated", "key": config.key}

if __name__ == "__main__":
    import uvicorn
    print(f"Starting QR Party Member System v{db.get_current_version()}")
    print(f"Database: {DB_PATH}")
    print(f"Active Gateways: {len(db.get_active_gateways())}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
