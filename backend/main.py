
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import shutil
import os
from datetime import datetime
import shutil

app = FastAPI(title="QR Party Member Identification System")

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
DB_FILE = os.path.join(UPLOAD_DIR, "database.xlsx")

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# Ensure Database Exists
def init_db():
    if not os.path.exists(DB_FILE):
        try:
            # Create a dummy initial dataframe
            data = {
                "Name": ["John Doe", "Jane Smith"],
                "Designation": ["Member", "Coordinator"],
                "Constituency": ["North Ward", "South Ward"],
                "Constituency Number": ["001", "002"],
                "Mobile Number": ["9876543210", "8765432109"],
                "QR Code ID": ["NW-001-000001", "SW-002-000002"],
                "Last Scanned At": ["", ""],
                "Scan Count": [0, 0]
            }
            df = pd.DataFrame(data)
            df.to_excel(DB_FILE, index=False)
            print(f"Initialized database at {DB_FILE}")
        except Exception as e:
            print(f"Error initializing DB: {e}")

init_db()

# Models
class ScanRequest(BaseModel):
    qrId: str

# Helper Functions
def read_excel():
    if not os.path.exists(DB_FILE):
        return pd.DataFrame()
    return pd.read_excel(DB_FILE).fillna("")

def save_excel(df):
    df.to_excel(DB_FILE, index=False)

# Routes

@app.get("/")
async def root():
    return {"message": "QR Party Member API is running", "status": "ok"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "database": os.path.exists(DB_FILE)}

@app.post("/api/upload")
async def upload_excel(file: UploadFile = File(...)):
    try:
        temp_file = os.path.join(UPLOAD_DIR, "temp_database.xlsx")
        with open(temp_file, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Verify structure
        df = pd.read_excel(temp_file)
        required_cols = {'Name', 'QR Code ID'}
        if not required_cols.issubset(df.columns):
            os.remove(temp_file)
            raise HTTPException(status_code=400, detail="Missing required columns: Name, QR Code ID")
        
        # Ensure additional columns exist if missing
        if 'Last Scanned At' not in df.columns:
            df['Last Scanned At'] = ""
        if 'Scan Count' not in df.columns:
            df['Scan Count'] = 0
            
        # Replace main DB
        df.to_excel(DB_FILE, index=False)
        os.remove(temp_file)
        
        return {"message": "Database updated successfully", "count": len(df)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scan")
async def scan_qr(request: ScanRequest):
    qr_id = request.qrId.strip()
    if not qr_id:
        raise HTTPException(status_code=400, detail="QR ID required")
    
    df = read_excel()
    if df.empty:
        raise HTTPException(status_code=500, detail="Database is empty or missing")

    # Change column types to string for comparison to avoid type mismatch
    df['QR Code ID'] = df['QR Code ID'].astype(str)
    
    # Locate member
    # Case-insensitive match on QR Code ID (strip whitespace)
    mask = df['QR Code ID'].str.strip().str.lower() == qr_id.lower()
    
    if not mask.any():
        raise HTTPException(status_code=404, detail="Member not found")
    
    member_idx = df.index[mask][0]
    member = df.loc[member_idx].to_dict()
    
    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")
    
    # Check if already scanned today - REMOVED to allow multiple scans per day (e.g. multiple meetings)
    # last_scanned = str(member.get('Last Scanned At', ''))
    # if last_scanned:
    #     try:
    #         if last_scanned.startswith(today_str):
    #              return {
    #                  "success": False, 
    #                  "error": "Already scanned today", 
    #                  "code": "ALREADY_SCANNED",
    #                  "member": member
    #              }
    #     except:
    #         pass

    # Update Member
    # Increment Scan Count
    new_count = int(pd.to_numeric(member.get('Scan Count', 0), errors='coerce') or 0) + 1
    
    df.at[member_idx, 'Last Scanned At'] = now.isoformat()
    df.at[member_idx, 'Scan Count'] = new_count
    
    save_excel(df)
    
    # Calculate global daily count
    # Convert 'Last Scanned At' column to string to safely check startswith
    scan_dates = df['Last Scanned At'].astype(str)
    daily_count = scan_dates[scan_dates.str.startswith(today_str)].count()
    
    updated_member = df.loc[member_idx].to_dict()
    
    # Clean up NaN for JSON response
    final_member = {k: ("" if pd.isna(v) else v) for k, v in updated_member.items()}
    
    return {
        "success": True, 
        "member": final_member, 
        "globalCount": int(daily_count)
    }

@app.get("/api/stats")
async def get_stats():
    df = read_excel()
    if df.empty:
        return {"totalMembers": 0, "scannedToday": 0, "members": []}
    
    total_members = len(df)
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    # Safe convert
    last_scanned_series = df['Last Scanned At'].astype(str)
    scanned_today = last_scanned_series[last_scanned_series.str.startswith(today_str)].count()
    
    # Convert entire DF to records for frontend table
    # Replace NaN with empty string
    members = df.fillna("").to_dict(orient="records")
    
    return {
        "totalMembers": int(total_members), 
        "scannedToday": int(scanned_today), 
        "members": members
    }

@app.get("/api/download")
async def download_db():
    if not os.path.exists(DB_FILE):
        raise HTTPException(status_code=404, detail="Database file not found")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"members_db_{timestamp}.xlsx"
    
    return FileResponse(DB_FILE, filename=filename, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
