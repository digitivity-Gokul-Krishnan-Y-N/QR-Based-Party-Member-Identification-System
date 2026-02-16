
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { Clock, CheckSquare, TrendingUp, Loader2 } from 'lucide-react';
import API_BASE_URL from '../config/api';
import './Stats.css';

const Stats = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalMembers: 0,
        scannedToday: 0,
        members: []
    });

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/stats`);
            setStats(res.data);
        } catch (err) {
            console.error("Failed to fetch stats", {
                status: err.response?.status,
                message: err.message,
                url: `${API_BASE_URL}/stats`
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 5000); // 5 sec poll
        return () => clearInterval(interval);
    }, []);

    // Prepare chart data (e.g. scans per hour today)
    const getHourlyData = () => {
        const hours = Array(24).fill(0);
        const today = new Date().toISOString().split('T')[0];

        stats.members.forEach(m => {
            if (m['Last Scanned At'] && m['Last Scanned At'].startsWith(today)) {
                const hour = new Date(m['Last Scanned At']).getHours();
                hours[hour]++;
            }
        });

        return hours.map((cnt, i) => ({
            hour: `${i}:00`,
            count: cnt
        }));
    };

    const chartData = getHourlyData();
    const recentMembers = stats.members
        .filter(m => m['Last Scanned At'])
        .sort((a, b) => new Date(b['Last Scanned At']) - new Date(a['Last Scanned At']))
        .slice(0, 5);

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
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: 'easeOut' },
        },
    };

    return (
        <motion.div 
            className="stats-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div 
                className="stats-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1>
                    <motion.span
                        animate={{ color: ['#3b82f6', '#60a5fa', '#3b82f6'] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        Live Dashboard
                    </motion.span>
                </h1>
            </motion.div>

            <motion.div 
                className="kpi-row"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {loading ? (
                    <>
                        <motion.div
                            className="kpi-card glass-panel"
                            variants={itemVariants}
                        >
                            <div className="loading-spinner">
                                <Loader2 size={32} />
                            </div>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Loading...</p>
                        </motion.div>
                        <motion.div
                            className="kpi-card glass-panel"
                            variants={itemVariants}
                        >
                            <div className="loading-spinner">
                                <Loader2 size={32} />
                            </div>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Loading...</p>
                        </motion.div>
                    </>
                ) : (
                    <>
                        <motion.div
                            className="kpi-card glass-panel"
                            variants={itemVariants}
                            whileHover={{ scale: 1.05, y: -5 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        >
                            <motion.div 
                                className="kpi-icon"
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Clock size={32} />
                            </motion.div>
                            <div className="kpi-content">
                                <h3>Scanned Today</h3>
                                <motion.div 
                                    className="kpi-value"
                                    key={stats.scannedToday}
                                    initial={{ scale: 1.2, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    {stats.scannedToday || '0'}
                                </motion.div>
                            </div>
                        </motion.div>

                        <motion.div
                            className="kpi-card glass-panel"
                            variants={itemVariants}
                            whileHover={{ scale: 1.05, y: -5 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        >
                            <motion.div 
                                className="kpi-icon"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <CheckSquare size={32} />
                            </motion.div>
                            <div className="kpi-content">
                                <h3>Total Members</h3>
                                <motion.div 
                                    className="kpi-value"
                                    key={stats.totalMembers}
                                    initial={{ scale: 1.2, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    {stats.totalMembers || '0'}
                                </motion.div>
                            </div>
                        </motion.div>
                    </>
                )}
            </motion.div>

            <motion.div 
                className="chart-container glass-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                whileHover={{ boxShadow: '0 10px 40px rgba(59, 130, 246, 0.2)' }}
            >
                <h3>
                    <TrendingUp size={24} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Hourly Activity
                </h3>
                {chartData.some(d => d.count > 0) ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
                                <XAxis dataKey="hour" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                                        borderColor: '#3b82f6',
                                        borderRadius: 8,
                                        border: '1px solid rgb(59, 130, 246)',
                                        color: '#f8fafc',
                                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)'
                                    }}
                                    itemStyle={{ color: '#60a5fa' }}
                                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                                />
                                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>
                ) : (
                    <motion.div 
                        className="chart-empty-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <p className="empty-text">No scans recorded yet today</p>
                        <p className="empty-subtext">Activity will appear here as members are scanned</p>
                    </motion.div>
                )}
            </motion.div>

            <motion.div 
                className="recent-list glass-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                whileHover={{ boxShadow: '0 10px 40px rgba(59, 130, 246, 0.2)' }}
            >
                <h3>Recently Verified</h3>
                {recentMembers.length > 0 ? (
                    <motion.ul
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {recentMembers.map((m, i) => (
                            <motion.li 
                                key={i} 
                                className="recent-item"
                                variants={itemVariants}
                                whileHover={{ x: 5, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                                transition={{ duration: 0.2 }}
                            >
                                <span className="timestamp">{new Date(m['Last Scanned At']).toLocaleTimeString()}</span>
                                <span className="member-name">{m.Name}</span>
                                <span className="constituency">{m.Constituency}</span>
                            </motion.li>
                        ))}
                    </motion.ul>
                ) : (
                    <motion.p 
                        className="empty-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        No members scanned yet
                    </motion.p>
                )}
            </motion.div>
        </motion.div>
    );
};

export default Stats;
