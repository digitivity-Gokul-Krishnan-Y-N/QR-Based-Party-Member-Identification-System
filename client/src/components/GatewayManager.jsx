import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Server, MapPin, CheckCircle, XCircle, RefreshCw, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.4, ease: 'easeOut' },
        },
    };

    return (
        <motion.div 
            className="gateway-manager-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div 
                className="gateway-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2 className="title-gradient">
                    <Server size={28} /> Gateway Management
                </h2>
                <motion.button
                    className="btn-primary"
                    onClick={() => setShowAddForm(!showAddForm)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Plus size={20} /> Add Gateway
                </motion.button>
            </motion.div>

            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className={`message ${message.type}`}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                        {message.type === 'success' ? (
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 0.5 }}
                            >
                                <CheckCircle size={20} />
                            </motion.div>
                        ) : (
                            <XCircle size={20} />
                        )}
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="add-gateway-form glass-panel"
                        transition={{ duration: 0.3 }}
                    >
                        <h3>Register New Gateway</h3>
                        <form onSubmit={handleAddGateway}>
                            <motion.div 
                                className="form-group"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                <label>Gateway ID *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., GATEWAY-002"
                                    value={newGateway.gatewayId}
                                    onChange={(e) => setNewGateway({ ...newGateway, gatewayId: e.target.value })}
                                    required
                                />
                            </motion.div>
                            <motion.div 
                                className="form-group"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.15 }}
                            >
                                <label>Gateway Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., North Zone Gateway"
                                    value={newGateway.gatewayName}
                                    onChange={(e) => setNewGateway({ ...newGateway, gatewayName: e.target.value })}
                                    required
                                />
                            </motion.div>
                            <motion.div 
                                className="form-group"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <label>Location</label>
                                <input
                                    type="text"
                                    placeholder="e.g., North Zone Office"
                                    value={newGateway.location}
                                    onChange={(e) => setNewGateway({ ...newGateway, location: e.target.value })}
                                />
                            </motion.div>
                            <motion.div 
                                className="form-actions"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.25 }}
                            >
                                <motion.button 
                                    type="submit" 
                                    className="btn-primary"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Register
                                </motion.button>
                                <motion.button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowAddForm(false)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Cancel
                                </motion.button>
                            </motion.div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div 
                className="gateways-grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {loading ? (
                    <motion.div 
                        className="loading"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        >
                            <RefreshCw size={32} />
                        </motion.div>
                        <p>Loading gateways...</p>
                    </motion.div>
                ) : gateways.length === 0 ? (
                    <motion.div 
                        className="empty-state glass-panel"
                        variants={itemVariants}
                    >
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Server size={48} />
                        </motion.div>
                        <p>No gateways registered</p>
                    </motion.div>
                ) : (
                    gateways.map((gateway, index) => (
                        <motion.div
                            key={gateway.id}
                            variants={itemVariants}
                            className={`gateway-card glass-panel ${gateway.is_active ? 'active' : 'inactive'}`}
                            whileHover={{ 
                                scale: 1.03,
                                boxShadow: gateway.is_active 
                                    ? '0 12px 30px rgba(16, 185, 129, 0.2)' 
                                    : '0 12px 30px rgba(239, 68, 68, 0.2)'
                            }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        >
                            <motion.div 
                                className="gateway-status"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
                            >
                                {gateway.is_active ? (
                                    <motion.div
                                        animate={{ opacity: [0.7, 1, 0.7] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <CheckCircle className="status-icon active" size={24} />
                                    </motion.div>
                                ) : (
                                    <XCircle className="status-icon inactive" size={24} />
                                )}
                            </motion.div>

                            <div className="gateway-info">
                                <h3>{gateway.gateway_name}</h3>
                                <p className="gateway-id">{gateway.gateway_id}</p>

                                {gateway.location && (
                                    <motion.div 
                                        className="gateway-location"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <MapPin size={16} />
                                        <span>{gateway.location}</span>
                                    </motion.div>
                                )}

                                <motion.div 
                                    className="gateway-meta"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <div className="meta-item">
                                        <span className="label">Last Sync:</span>
                                        <span className="value">{formatDate(gateway.last_sync_at)}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="label">Created:</span>
                                        <span className="value">{formatDate(gateway.created_at)}</span>
                                    </div>
                                </motion.div>
                            </div>

                            <motion.div 
                                className="gateway-actions"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <motion.button
                                    className="btn-sync"
                                    onClick={() => handleSync(gateway.gateway_id)}
                                    disabled={!gateway.is_active}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <RefreshCw size={16} /> Sync
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    ))
                )}
            </motion.div>

            <motion.div 
                className="gateway-stats glass-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ boxShadow: '0 10px 40px rgba(59, 130, 246, 0.2)' }}
            >
                <h3>Gateway Statistics</h3>
                <div className="stats-row">
                    {[
                        { label: 'Total Gateways', value: gateways.length },
                        { label: 'Active Gateways', value: gateways.filter(g => g.is_active).length },
                        { label: 'Inactive Gateways', value: gateways.filter(g => !g.is_active).length }
                    ].map((stat, idx) => (
                        <motion.div 
                            key={idx}
                            className="stat-item"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + idx * 0.1 }}
                            whileHover={{ scale: 1.05 }}
                        >
                            <span className="stat-label">{stat.label}</span>
                            <motion.span 
                                className="stat-value"
                                key={stat.value}
                                initial={{ scale: 1.2, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.4 }}
                            >
                                {stat.value}
                            </motion.span>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default GatewayManager;
