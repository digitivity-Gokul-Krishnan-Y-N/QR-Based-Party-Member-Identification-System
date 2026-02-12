
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const DB_FILE = path.join(UPLOAD_DIR, 'database.xlsx');

// Initialize dummy database if not exists
if (!fs.existsSync(DB_FILE)) {
    const dummyData = [
        {
            "Name": "John Doe",
            "Designation": "Member",
            "Constituency": "North Ward",
            "Constituency Number": "001",
            "Mobile Number": "9876543210",
            "QR Code ID": "NW-001-000001",
            "Last Scanned At": "",
            "Scan Count": 0
        },
        {
            "Name": "Jane Smith",
            "Designation": "Coordinator",
            "Constituency": "South Ward",
            "Constituency Number": "002",
            "Mobile Number": "8765432109",
            "QR Code ID": "SW-002-000002",
            "Last Scanned At": "",
            "Scan Count": 0
        }
    ];
    const ws = xlsx.utils.json_to_sheet(dummyData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Members");
    xlsx.writeFile(wb, DB_FILE);
    console.log("Created dummy database.xlsx");
}

// Multer setup for Excel upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, 'database.xlsx') // overwrite existing
});
const upload = multer({ storage });

const readExcel = () => {
    if (!fs.existsSync(DB_FILE)) return [];
    try {
        const workbook = xlsx.readFile(DB_FILE);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        return xlsx.utils.sheet_to_json(sheet, { defval: "" }); // defval ensures empty cells are handled
    } catch (err) {
        console.error("Error reading Excel:", err);
        return [];
    }
};

const updateExcel = (data) => {
    try {
        const worksheet = xlsx.utils.json_to_sheet(data);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Members');
        xlsx.writeFile(workbook, DB_FILE);
        return true;
    } catch (err) {
        console.error("Error writing Excel:", err);
        return false;
    }
};

// Routes

// 1. Upload Excel
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Validate structure
    const data = readExcel();
    if (data.length === 0) return res.status(400).json({ error: 'Empty or invalid Excel file' });

    // Check required columns
    const requiredCols = ['Name', 'QR Code ID'];
    const hasCols = requiredCols.every(col => Object.keys(data[0]).includes(col));

    if (!hasCols) {
        // Try to revert? Or just warn.
        // For now, let's keep the file but warn.
        // Actually, if it's invalid, we might want to restore a backup, but let's keep it simple.
        return res.status(400).json({ error: 'Missing required columns: Name, QR Code ID' });
    }

    res.json({ message: 'Database updated successfully', count: data.length });
});

// 2. Scan QR
app.post('/api/scan', (req, res) => {
    const { qrId } = req.body;
    if (!qrId) return res.status(400).json({ error: 'QR ID required' });

    let data = readExcel();
    const memberIndex = data.findIndex(m => String(m['QR Code ID']).trim() === String(qrId).trim());

    if (memberIndex === -1) {
        return res.status(404).json({ error: 'Member not found', success: false });
    }

    const member = { ...data[memberIndex] };
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Validate duplicate scan for today
    // format of Last Scanned At: ISO string
    let lastScannedDate = null;
    if (member['Last Scanned At']) {
        try {
            lastScannedDate = new Date(member['Last Scanned At']).toISOString().split('T')[0];
        } catch (e) { }
    }

    if (lastScannedDate === today) {
        return res.status(400).json({
            error: 'Already scanned today',
            member,
            success: false,
            code: 'ALREADY_SCANNED'
        });
    }

    // Update member
    member['Last Scanned At'] = now.toISOString();
    // Increment scan count
    let currentCount = parseInt(member['Scan Count']);
    if (isNaN(currentCount)) currentCount = 0;
    member['Scan Count'] = currentCount + 1;

    data[memberIndex] = member;

    if (updateExcel(data)) {
        // Calculate global stats for today
        const todayCount = data.filter(m => {
            if (!m['Last Scanned At']) return false;
            try {
                return new Date(m['Last Scanned At']).toISOString().startsWith(today);
            } catch (e) { return false; }
        }).length;

        res.json({ success: true, member, globalCount: todayCount });
    } else {
        res.status(500).json({ error: 'Failed to update database' });
    }
});

// 3. Get Stats
app.get('/api/stats', (req, res) => {
    const data = readExcel();
    const totalMembers = data.length;

    const today = new Date().toISOString().split('T')[0];
    const scannedToday = data.filter(m => {
        if (!m['Last Scanned At']) return false;
        try {
            return new Date(m['Last Scanned At']).toISOString().startsWith(today);
        } catch (e) { return false; }
    }).length;

    res.json({ totalMembers, scannedToday, members: data });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
