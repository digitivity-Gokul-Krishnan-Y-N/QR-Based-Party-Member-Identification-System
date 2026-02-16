
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileUp, CheckCircle, AlertTriangle, RefreshCw, Clock, Database, AlertCircle, Inbox } from 'lucide-react';
import { motion } from 'framer-motion';
import API_BASE_URL from '../config/api';
import './Admin.css';

const Admin = () => {
    const [file, setFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [uploadResult, setUploadResult] = useState(null);
    const [stats, setStats] = useState({ totalMembers: 0, scannedToday: 0, members: [] });
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [gateways, setGateways] = useState([]);
    const [selectedGateway, setSelectedGateway] = useState('GATEWAY-001');
    const [uploadHistory, setUploadHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);

    const fetchGateways = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/gateways/active`);
            setGateways(res.data.gateways);
        } catch (err) {
            console.error("Failed to fetch gateways:", {
                status: err.response?.status,
                message: err.message,
                url: `${API_BASE_URL}/gateways/active`
            });
        }
    };

    const fetchStats = async () => {
        setRefreshing(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/stats`, {
                params: { gatewayId: selectedGateway }
            });
            setStats(res.data);
        } catch (err) {
            console.error("Failed to fetch stats:", {
                status: err.response?.status,
                message: err.message,
                url: `${API_BASE_URL}/stats`
            });
        } finally {
            setRefreshing(false);
        }
    };

    const fetchUploadHistory = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/upload/history`, {
                params: { gatewayId: selectedGateway }
            });
            setUploadHistory(res.data.history);
        } catch (err) {
            console.error("Failed to fetch upload history:", {
                status: err.response?.status,
                message: err.message,
                url: `${API_BASE_URL}/upload/history`
            });
        }
    };

    useEffect(() => {
        const initializeData = async () => {
            setLoading(true);
            try {
                await Promise.all([fetchGateways(), fetchStats(), fetchUploadHistory()]);
            } catch (err) {
                console.error("Failed to initialize admin data", err);
            } finally {
                setLoading(false);
            }
        };
        initializeData();
    }, [selectedGateway]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setUploadStatus(null);
        setUploadResult(null);
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploadStatus('uploading');
        setUploadResult(null);

        try {
            const res = await axios.post(`${API_BASE_URL}/upload?gatewayId=${selectedGateway}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploadStatus('success');
            setUploadResult(res.data);
            fetchStats();
            fetchUploadHistory();
            setFile(null);
        } catch (err) {
            console.error(err);
            setUploadStatus('error');
            setUploadResult({
                message: err.response?.data?.detail || 'Upload failed',
                errors: err.response?.data?.errors || []
            });
        }
    };


    return (
        <div className="admin-container">
            <h2 className="title-gradient">System Administration</h2>

            {/* Gateway Selector */}
            <div className="gateway-selector glass-panel">
                <label><Database size={20} /> Select Gateway:</label>
                <select
                    value={selectedGateway}
                    onChange={(e) => setSelectedGateway(e.target.value)}
                    className="gateway-select"
                >
                    {gateways.map(gateway => (
                        <option key={gateway.id} value={gateway.gateway_id}>
                            {gateway.gateway_name} ({gateway.gateway_id})
                        </option>
                    ))}
                </select>
            </div>

            <div className="stats-grid">
                {loading ? (
                    <>
                        <motion.div className="stat-card glass-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <Clock size={32} className="loading-spinner" />
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Loading...</p>
                        </motion.div>
                        <motion.div className="stat-card glass-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                            <Clock size={32} className="loading-spinner" />
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Loading...</p>
                        </motion.div>
                    </>
                ) : (
                    <>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="stat-card glass-panel"
                            whileHover={{ scale: 1.02, y: -5 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                        >
                            <h3>Total Members</h3>
                            <div className="stat-value">{stats.totalMembers || '0'}</div>
                            <p className="stat-label">in {selectedGateway}</p>
                        </motion.div>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                            className="stat-card glass-panel"
                            whileHover={{ scale: 1.02, y: -5 }}
                        >
                            <h3>Scanned Today</h3>
                            <div className="stat-value">{stats.scannedToday || '0'}</div>
                            <p className="stat-label">valid scans</p>
                        </motion.div>
                    </>
                )}
            </div>

            <motion.div 
                className="upload-section glass-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h3><FileUp size={24} /> Update Database</h3>
                <p>Upload the latest .xlsx file to update member records for {selectedGateway}.</p>

                <div className="file-input-wrapper">
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                        id="file-upload"
                        className="file-input"
                    />
                    <label htmlFor="file-upload" className="file-label btn-primary"
                        style={{
                            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }}
                    >
                        {file ? file.name : "Select Excel File"}
                    </label>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: file ? 1 : 0, scale: file ? 1 : 0.8 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    {file && (
                        <button
                            onClick={handleUpload}
                            disabled={uploadStatus === 'uploading'}
                            className="upload-submit-btn"
                            style={{
                                cursor: uploadStatus === 'uploading' ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {uploadStatus === 'uploading' ? (
                                <motion.span
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                >
                                    ⚙️ Uploading...
                                </motion.span>
                            ) : (
                                'Confirm Upload'
                            )}
                        </button>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: uploadStatus === 'success' ? 1 : 0, y: uploadStatus === 'success' ? 0 : -10 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    {uploadStatus === 'success' && uploadResult && (
                        <motion.div className="status-msg success"
                            whileIn={{ scale: [0.95, 1] }}
                        >
                            <CheckCircle size={20} />
                            <div>
                                <strong>Upload Successful!</strong>
                                <p>Total: {uploadResult.total} | Success: {uploadResult.successful} | Failed: {uploadResult.failed}</p>
                                {uploadResult.errors && uploadResult.errors.length > 0 && (
                                    <details>
                                        <summary>View Errors ({uploadResult.errors.length})</summary>
                                        <ul className="error-list">
                                            {uploadResult.errors.map((err, idx) => (
                                                <motion.li key={idx}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                >
                                                    {err}
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </details>
                                )}
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: uploadStatus === 'error' ? 1 : 0, y: uploadStatus === 'error' ? 0 : -10 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    {uploadStatus === 'error' && uploadResult && (
                        <motion.div className="status-msg error"
                            whileIn={{ scale: [0.95, 1] }}
                        >
                            <AlertTriangle size={20} />
                            <div>
                                <strong>Upload Failed!</strong>
                                <p>{uploadResult.message}</p>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>

            {/* Upload History */}
            <div className="upload-history glass-panel">
                <div className="history-header">
                    <h3><Clock size={24} /> Upload History</h3>
                    <button
                        className="btn-toggle"
                        onClick={() => setShowHistory(!showHistory)}
                    >
                        {showHistory ? 'Hide' : 'Show'} History
                    </button>
                </div>

                {showHistory && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="history-list"
                    >
                        {uploadHistory.length === 0 ? (
                            <div className="empty-state" style={{ margin: '2rem auto', padding: '2rem', textAlign: 'center' }}>
                                <Clock size={40} className="empty-state-icon" />
                                <div className="empty-state-text">No upload history</div>
                                <div className="empty-state-subtext">Uploads will appear here after files are processed</div>
                            </div>
                        ) : (
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>Batch ID</th>
                                        <th>File Name</th>
                                        <th>Upload Date</th>
                                        <th>Total</th>
                                        <th>Success</th>
                                        <th>Failed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {uploadHistory.map((batch, idx) => (
                                        <motion.tr 
                                            key={idx}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05, duration: 0.3 }}
                                            whileHover={{ 
                                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                transition: { duration: 0.2 }
                                            }}
                                        >
                                            <td className="batch-id">{batch.batch_id}</td>
                                            <td>{batch.file_name}</td>
                                            <td>{new Date(batch.upload_date).toLocaleString()}</td>
                                            <td>{batch.total_records}</td>
                                            <td className="success-count">{batch.successful_records}</td>
                                            <td className="failed-count">{batch.failed_records}</td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Member List Table */}
            <motion.div 
                className="members-section glass-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h3>Member Scan History</h3>
                <div className="table-container">
                    <table className="members-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Designation</th>
                                <th>QR ID</th>
                                <th>Upload Date</th>
                                <th>Last Scanned</th>
                                <th>Total Scans</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.members && stats.members.length > 0 ? (
                                stats.members.map((member, index) => (
                                    <motion.tr 
                                        key={index}
                                        className="table-row-hover"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05, duration: 0.3 }}
                                        whileHover={{ 
                                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                            paddingLeft: '5px',
                                            transition: { duration: 0.2 }
                                        }}
                                    >
                                        <td>{member.Name}</td>
                                        <td>{member.Designation}</td>
                                        <td>{member['QR Code ID']}</td>
                                        <td>
                                            {member['Upload Date']
                                                ? new Date(member['Upload Date']).toLocaleDateString()
                                                : <span className="text-muted">-</span>}
                                        </td>
                                        <td>
                                            {member['Last Scanned At']
                                                ? new Date(member['Last Scanned At']).toLocaleString()
                                                : <span className="text-muted">-</span>}
                                        </td>
                                        <td className="text-center">{member['Scan Count'] || 0}</td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center">
                                        <div className="empty-state" style={{ margin: '2rem 0', borderRadius: '8px' }}>
                                            <Inbox size={40} className="empty-state-icon" />
                                            <div className="empty-state-text">No members found</div>
                                            <div className="empty-state-subtext">Upload an Excel file to populate member data</div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            <button onClick={fetchStats} className="refresh-btn">
                <RefreshCw size={20} className={refreshing ? 'spin' : ''} /> Refresh Data
            </button>
        </div>
    );
};

export default Admin;
