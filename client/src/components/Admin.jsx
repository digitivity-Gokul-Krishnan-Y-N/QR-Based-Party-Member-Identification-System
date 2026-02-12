
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileUp, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import API_BASE_URL from '../config/api';
import './Admin.css'; // Will create this later, need to define glassmorphism there too.

const Admin = () => {
    const [file, setFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState(null); // 'uploading', 'success', 'error'
    const [stats, setStats] = useState({ totalMembers: 0, scannedToday: 0 });
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        setRefreshing(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/stats`);
            setStats(res.data);
        } catch (err) {
            console.error("Failed to fetch stats", err);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setUploadStatus(null);
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploadStatus('uploading');

        try {
            await axios.post(`${API_BASE_URL}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploadStatus('success');
            fetchStats();
            setFile(null);
        } catch (err) {
            console.error(err);
            setUploadStatus('error');
        }
    };

    return (
        <div className="admin-container">
            <h2 className="title-gradient">System Administration</h2>

            <div className="stats-grid">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="stat-card glass-panel"
                >
                    <h3>Total Members</h3>
                    <div className="stat-value">{stats.totalMembers}</div>
                </motion.div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="stat-card glass-panel"
                >
                    <h3>Scanned Today</h3>
                    <div className="stat-value">{stats.scannedToday}</div>
                </motion.div>
            </div>

            <div className="upload-section glass-panel">
                <h3><FileUp size={24} /> Update Database</h3>
                <p>Upload the latest .xlsx file to update member records.</p>

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

                {uploadStatus === 'success' && (
                    <div className="status-msg success">
                        <CheckCircle size={20} /> Database Updated Successfully!
                    </div>
                )}

                {uploadStatus === 'error' && (
                    <div className="status-msg error">
                        <AlertTriangle size={20} /> Upload Failed. Check file format.
                    </div>
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
                                            {member['Last Scanned At']
                                                ? new Date(member['Last Scanned At']).toLocaleString()
                                                : <span className="text-muted">-</span>}
                                        </td>
                                        <td className="text-center">{member['Scan Count'] || 0}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center">No members found</td>
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
