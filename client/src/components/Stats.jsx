
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { Clock, CheckSquare } from 'lucide-react';
import './Stats.css';

const Stats = () => {
    const [stats, setStats] = useState({
        totalMembers: 0,
        scannedToday: 0,
        members: []
    });

    const fetchStats = async () => {
        try {
            const res = await axios.get('/api/stats');
            setStats(res.data);
        } catch (err) {
            console.error("Failed to fetch stats");
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

    return (
        <div className="stats-container">
            <h2 className="title-gradient">Live Dashboard</h2>

            <div className="kpi-row">
                <motion.div
                    className="kpi-card glass-panel"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="kpi-icon"><Clock size={32} /></div>
                    <div className="kpi-content">
                        <h3>Scanned Today</h3>
                        <div className="kpi-value">{stats.scannedToday}</div>
                    </div>
                </motion.div>

                <motion.div
                    className="kpi-card glass-panel"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="kpi-icon"><CheckSquare size={32} /></div>
                    <div className="kpi-content">
                        <h3>Total Members</h3>
                        <div className="kpi-value">{stats.totalMembers}</div>
                    </div>
                </motion.div>
            </div>

            <div className="chart-container glass-panel">
                <h3>Hourly Activity</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                        <XAxis dataKey="hour" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                            itemStyle={{ color: '#3b82f6' }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="recent-list glass-panel">
                <h3>Recently Verified</h3>
                <ul>
                    {stats.members
                        .filter(m => m['Last Scanned At'])
                        .sort((a, b) => new Date(b['Last Scanned At']) - new Date(a['Last Scanned At']))
                        .slice(0, 5)
                        .map((m, i) => (
                            <li key={i} className="recent-item">
                                <span className="timestamp">{new Date(m['Last Scanned At']).toLocaleTimeString()}</span>
                                <span className="member-name">{m.Name}</span>
                                <span className="constituency">{m.Constituency}</span>
                            </li>
                        ))}
                </ul>
            </div>
        </div>
    );
};

export default Stats;
