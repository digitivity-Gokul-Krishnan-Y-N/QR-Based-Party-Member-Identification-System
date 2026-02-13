# QR-Based Party Member Identification System - Master Summary
**Status**: Completed ✅ | **Version**: 1.0.0

## 1. Project Overview
We have successfully built an **Offline Local System** for identifying party members via QR codes. It is designed to run locally on machines without internet access, ensuring data privacy and reliability.

### Key Features Delivered
- **Offline Reliability**: Uses a local SQLite database (no internet needed).
- **Multiple Gateways**: Supports 10+ independent attendance gates.
- **Excel Synchronization**: Simple, non-technical data sharing between gates.
- **Duplication Prevention**: Prevents double-scanning (1-hour cooldown).
- **Upload Tracking**: Validates scans based on when data was uploaded.
- **QR Code Generation**: Download individual or bulk QR codes.

---

## 2. Deployment Guide (10 Gateways)

### Prerequisites
- 10 Computers/Laptops
- 1 USB Drive (for transferring Excel files)
- This software package

### Step-by-Step Setup
1.  **Set up the Master System (Gateway 1)**
    -   Install the software (`npm start`).
    -   Go to **Gateways** page → Register as `GATEWAY-001`.
    -   Go to **Admin** page → Upload your full Member List (Excel).
    -   **Download Database** (scroll down on Admin page) → Save this Excel file to your USB drive. This is your **Master File**.

2.  **Set up Remaining 9 Systems**
    -   Install software on the computer.
    -   Register a **Unique ID** (e.g., `GATEWAY-002`, `GATEWAY-003`, etc.).
    -   Go to **Admin** page → Upload the **Master File** from your USB drive.

**Result**: All 10 gateways now have the same member data but operate independently to track their own scans.

---

## 3. How to Sync Data (The Excel Method)

Since computers are offline, we use Excel files to keep them in sync. This is simple and requires no technical skills.

### To Add New Members:
1.  Open your **Master Excel File** on any computer.
2.  Add the new members (Name, QR ID, etc.).
3.  Go to the **Admin** page on **EACH** gateway.
4.  Upload the updated Excel file.
5.  The system will add the new members automatically.

### To Update Member Details:
1.  Edit the details in the Excel file (e.g., change Designation).
2.  **Important**: Keep the `QR Code ID` the same.
3.  Upload to all gateways.

---

## 4. Feature Guides

### A. Duplication Prevention
**Goal**: Prevent a member from scanning twice at the same gate to inflate numbers.
-   **Rule**: If a member scans, they cannot scan again at that same gateway for **1 Hour**.
-   **Message**: "Already scanned. Wait X minutes."
-   **Customization**: Edit `backend/database.py` (search for `time_diff < 60`) to change the minutes.

### B. Upload Date Validation
**Goal**: Ensure members were actually registered before they entered.
-   **Rule**: A scan is only valid if the member's data was uploaded to the system *before* the scan happened.

### C. QR Code Generator
1.  Go to **Generator** page.
2.  **Download Individual**: Click the "Download" button on any specific member card (saves as PNG).
3.  **Bulk Download**: Click "Download All PNGs" to save everyone.
4.  **Printable PDF**: Click "Download PDF" for a layout ready for printing.

---

## 5. Technical Details

-   **Database**: SQLite (`backend/party_members.db`).
-   **Frontend**: React + Vite.
-   **Backend**: Python FastAPI.
-   **Installation**:
    -   **Windows**: Run `install.bat`
    -   **Mac/Linux**: Run `install.sh`
-   **Start Command**: `npm start` (Runs both client and server).

## 6. Troubleshooting

| Issue | Solution |
|-------|----------|
| **Upload Fails** | Check Excel headers (`Name`, `QR Code ID`). Ensure file is `.xlsx`. |
| **Duplicate Scan Error** | The member scanned <1 hour ago. Wait or reduce the cooldown in code. |
| **Camera Not Working** | Allow browser permissions. Ensure no other app is using the camera. |
| **System Won't Start** | Check if Node.js/Python are installed. Restart computer. |

---

### Final Check
You are ready to go!
1.  **Install** on all machines.
2.  **Upload** Excel data.
3.  **Start Scanning**.
