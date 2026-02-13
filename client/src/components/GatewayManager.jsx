import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Server, MapPin, CheckCircle, XCircle, RefreshCw, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import API_BASE_URL from '../config/api';
import './GatewayManager.css';

const GatewayManager = () => {
    const [gateways, setGateways] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newGateway, setNewGateway] = useState({
        gatewayId: '',
        gatewayName: '',
        location: ''
    });
    const [message, setMessage] = useState(null);

    const fetchGateways = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/gateways`);
            setGateways(res.data.gateways);
        } catch (err) {
            console.error("Failed to fetch gateways", err);
            setMessage({ type: 'error', text: 'Failed to load gateways' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGateways();
    }, []);

    const handleAddGateway = async (e) => {
        e.preventDefault();

        if (!newGateway.gatewayId || !newGateway.gatewayName) {
            setMessage({ type: 'error', text: 'Gateway ID and Name are required' });
            return;
        }

        try {
            await axios.post(`${API_BASE_URL}/gateways/register`, newGateway);
            setMessage({ type: 'success', text: 'Gateway registered successfully' });
            setNewGateway({ gatewayId: '', gatewayName: '', location: '' });
            setShowAddForm(false);
            fetchGateways();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to register gateway' });
        }
    };

    const handleSync = async (gatewayId) => {
        try {
            await axios.post(`${API_BASE_URL}/gateways/${gatewayId}/sync`);
            setMessage({ type: 'success', text: `Gateway ${gatewayId} synced` });
            fetchGateways();
        } catch (err) {
            setMessage({ type: 'error', text: 'Sync failed' });
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Never';
        return new Date(dateStr).toLocaleString();
    };

    return (
        <div className="gateway-manager-container">
            <div className="gateway-header">
                <h2 className="title-gradient">
                    <Server size={28} /> Gateway Management
                </h2>
                <button
                    className="btn-primary"
                    onClick={() => setShowAddForm(!showAddForm)}
                >
                    <Plus size={20} /> Add Gateway
                </button>
            </div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`message ${message.type}`}
                >
                    {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                    {message.text}
                </motion.div>
            )}

            {showAddForm && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="add-gateway-form glass-panel"
                >
                    <h3>Register New Gateway</h3>
                    <form onSubmit={handleAddGateway}>
                        <div className="form-group">
                            <label>Gateway ID *</label>
                            <input
                                type="text"
                                placeholder="e.g., GATEWAY-002"
                                value={newGateway.gatewayId}
                                onChange={(e) => setNewGateway({ ...newGateway, gatewayId: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Gateway Name *</label>
                            <input
                                type="text"
                                placeholder="e.g., North Zone Gateway"
                                value={newGateway.gatewayName}
                                onChange={(e) => setNewGateway({ ...newGateway, gatewayName: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Location</label>
                            <input
                                type="text"
                                placeholder="e.g., North Zone Office"
                                value={newGateway.location}
                                onChange={(e) => setNewGateway({ ...newGateway, location: e.target.value })}
                            />
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn-primary">Register</button>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setShowAddForm(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            <div className="gateways-grid">
                {loading ? (
                    <div className="loading">
                        <RefreshCw className="spin" size={32} />
                        <p>Loading gateways...</p>
                    </div>
                ) : gateways.length === 0 ? (
                    <div className="empty-state glass-panel">
                        <Server size={48} />
                        <p>No gateways registered</p>
                    </div>
                ) : (
                    gateways.map((gateway, index) => (
                        <motion.div
                            key={gateway.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className={`gateway-card glass-panel ${gateway.is_active ? 'active' : 'inactive'}`}
                        >
                            <div className="gateway-status">
                                {gateway.is_active ? (
                                    <CheckCircle className="status-icon active" size={24} />
                                ) : (
                                    <XCircle className="status-icon inactive" size={24} />
                                )}
                            </div>

                            <div className="gateway-info">
                                <h3>{gateway.gateway_name}</h3>
                                <p className="gateway-id">{gateway.gateway_id}</p>

                                {gateway.location && (
                                    <div className="gateway-location">
                                        <MapPin size={16} />
                                        <span>{gateway.location}</span>
                                    </div>
                                )}

                                <div className="gateway-meta">
                                    <div className="meta-item">
                                        <span className="label">Last Sync:</span>
                                        <span className="value">{formatDate(gateway.last_sync_at)}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="label">Created:</span>
                                        <span className="value">{formatDate(gateway.created_at)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="gateway-actions">
                                <button
                                    className="btn-sync"
                                    onClick={() => handleSync(gateway.gateway_id)}
                                    disabled={!gateway.is_active}
                                >
                                    <RefreshCw size={16} /> Sync
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <div className="gateway-stats glass-panel">
                <h3>Gateway Statistics</h3>
                <div className="stats-row">
                    <div className="stat-item">
                        <span className="stat-label">Total Gateways</span>
                        <span className="stat-value">{gateways.length}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Active Gateways</span>
                        <span className="stat-value">
                            {gateways.filter(g => g.is_active).length}
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Inactive Gateways</span>
                        <span className="stat-value">
                            {gateways.filter(g => !g.is_active).length}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GatewayManager;
