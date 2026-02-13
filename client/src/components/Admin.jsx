
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileUp, CheckCircle, AlertTriangle, RefreshCw, Clock, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import API_BASE_URL from '../config/api';
import './Admin.css';

const Admin = () => {
    const [file, setFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [uploadResult, setUploadResult] = useState(null);
    const [stats, setStats] = useState({ totalMembers: 0, scannedToday: 0, members: [] });
    const [refreshing, setRefreshing] = useState(false);
    const [gateways, setGateways] = useState([]);
    const [selectedGateway, setSelectedGateway] = useState('GATEWAY-001');
    const [uploadHistory, setUploadHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);

    const fetchGateways = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/gateways/active`);
            setGateways(res.data.gateways);
        } catch (err) {
            console.error("Failed to fetch gateways", err);
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
            console.error("Failed to fetch stats", err);
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
            console.error("Failed to fetch upload history", err);
        }
    };

    useEffect(() => {
        fetchGateways();
        fetchStats();
        fetchUploadHistory();
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
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="stat-card glass-panel"
                >
                    <h3>Total Members</h3>
                    <div className="stat-value">{stats.totalMembers}</div>
                    <p className="stat-label">in {selectedGateway}</p>
                </motion.div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="stat-card glass-panel"
                >
                    <h3>Scanned Today</h3>
                    <div className="stat-value">{stats.scannedToday}</div>
                    <p className="stat-label">valid scans</p>
                </motion.div>
            </div>

            <div className="upload-section glass-panel">
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
                    <label htmlFor="file-upload" className="file-label btn-primary">
                        {file ? file.name : "Select Excel File"}
                    </label>
                </div>

                {file && (
                    <button
                        onClick={handleUpload}
                        disabled={uploadStatus === 'uploading'}
                        className="upload-submit-btn"
                    >
                        {uploadStatus === 'uploading' ? 'Uploading...' : 'Confirm Upload'}
                    </button>
                )}

                {uploadStatus === 'success' && uploadResult && (
                    <div className="status-msg success">
                        <CheckCircle size={20} />
                        <div>
                            <strong>Upload Successful!</strong>
                            <p>Total: {uploadResult.total} | Success: {uploadResult.successful} | Failed: {uploadResult.failed}</p>
                            {uploadResult.errors && uploadResult.errors.length > 0 && (
                                <details>
                                    <summary>View Errors ({uploadResult.errors.length})</summary>
                                    <ul className="error-list">
                                        {uploadResult.errors.map((err, idx) => (
                                            <li key={idx}>{err}</li>
                                        ))}
                                    </ul>
                                </details>
                            )}
                        </div>
                    </div>
                )}

                {uploadStatus === 'error' && (
                    <div className="status-msg error">
                        <AlertTriangle size={20} />
                        <div>
                            <strong>Upload Failed</strong>
                            <p>{uploadResult?.message || 'Check file format and try again'}</p>
                        </div>
                    </div>
                )}
            </div>

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
                            <p className="text-muted">No upload history available</p>
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
                                        <tr key={idx}>
                                            <td className="batch-id">{batch.batch_id}</td>
                                            <td>{batch.file_name}</td>
                                            <td>{new Date(batch.upload_date).toLocaleString()}</td>
                                            <td>{batch.total_records}</td>
                                            <td className="success-count">{batch.successful_records}</td>
                                            <td className="failed-count">{batch.failed_records}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Member List Table */}
            <div className="members-section glass-panel">
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
                                    <tr key={index}>
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
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center">No members found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <button onClick={fetchStats} className="refresh-btn">
                <RefreshCw size={20} className={refreshing ? 'spin' : ''} /> Refresh Data
            </button>
        </div>
    );
};

export default Admin;
