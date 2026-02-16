
import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Search, User, Loader2 } from 'lucide-react';
import API_BASE_URL from '../config/api';
import './Scanner.css'; // Will create this for specific styles

const Scanner = () => {
    const videoRef = useRef(null);
    const [scanResult, setScanResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scanner, setScanner] = useState(null);
    const [error, setError] = useState(null);
    const [lastScannedCode, setLastScannedCode] = useState(null);

    const handleScan = async (result) => {
        if (!result || loading) return;

        const code = result.data;
        if (code === lastScannedCode) return; // Prevent rapid duplicate calls for same code in view

        setLoading(true);
        setLastScannedCode(code);

        try {
            const response = await axios.post(`${API_BASE_URL}/scan`, { qrId: code });
            setScanResult({ type: 'success', data: response.data });
            // Play success sound?
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.detail || err.response?.data?.error || 'Scan Failed';
            const codeErr = err.response?.data?.code;
            setScanResult({ type: 'error', message: msg, code: codeErr, member: err.response?.data?.member });
        } finally {
            setLoading(false);
            // Reset scan lock after 3 seconds
            setTimeout(() => setLastScannedCode(null), 3000);
        }
    };

    useEffect(() => {
        if (videoRef.current && !scanner) {
            const qrScanner = new QrScanner(
                videoRef.current,
                result => handleScan(result),
                {
                    highlightScanRegion: true,
                    highlightCodeOutline: true,
                    returnDetailedScanResult: true,
                    willReadFrequently: true
                }
            );
            qrScanner.start().then(() => {
                setScanner(qrScanner);
            }).catch(e => setError("Camera access denied or not available."));

            return () => {
                qrScanner.stop();
                qrScanner.destroy();
            };
        }
    }, [videoRef]);

    const resetScan = () => {
        setScanResult(null);
        setLastScannedCode(null);
    };

    return (
        <div className="scanner-container">
            <motion.h2 
                className="title-gradient" 
                style={{ textAlign: 'center', marginBottom: '1rem' }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Search size={28} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Sankalp Member Scanner
            </motion.h2>

            <motion.div 
                className="camera-wrapper glass-panel"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                whileHover={{ boxShadow: '0 10px 40px rgba(59, 130, 246, 0.2)' }}
            >
                <video ref={videoRef} className="camera-feed"></video>
                <motion.div 
                    className="overlay-guide"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                ></motion.div>
                {error && (
                    <motion.div 
                        className="camera-error"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {error}
                    </motion.div>
                )}
            </motion.div>

            <AnimatePresence>
                {scanResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -50, scale: 0.95 }}
                        className={`result-card glass-panel ${scanResult.type}`}
                        onClick={resetScan}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                        {scanResult.type === 'success' ? (
                            <motion.div 
                                className="success-content"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                >
                                    <CheckCircle size={48} color="#10b981" />
                                </motion.div>
                                <h3>Verified Member</h3>
                                <motion.div 
                                    className="member-details"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <motion.p
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 }}
                                    >
                                        <strong>Name:</strong> {scanResult.data.member.Name}
                                    </motion.p>
                                    <motion.p
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <strong>Constituency:</strong> {scanResult.data.member.Constituency}
                                    </motion.p>
                                    <motion.p
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.6 }}
                                    >
                                        <strong>ID:</strong> {scanResult.data.member['QR Code ID']}
                                    </motion.p>
                                </motion.div>
                                <motion.div 
                                    className="scan-count-badge"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                                >
                                    Today's Global Count: {scanResult.data.globalCount}
                                </motion.div>
                                <motion.button 
                                    className="btn-primary" 
                                    onClick={resetScan}
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.7 }}
                                >
                                    Next Scan
                                </motion.button>
                            </motion.div>
                        ) : (
                            <motion.div 
                                className="error-content"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                >
                                    <XCircle size={48} color="#ef4444" />
                                </motion.div>
                                <h3>{scanResult.message}</h3>
                                {scanResult.member && (
                                    <motion.div 
                                        className="member-details error"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <p><strong>Name:</strong> {scanResult.member.Name}</p>
                                        <p>Previously Scanned At: {new Date(scanResult.member['Last Scanned At']).toLocaleTimeString()}</p>
                                    </motion.div>
                                )}
                                <motion.button 
                                    className="btn-primary error-btn" 
                                    onClick={resetScan}
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    Dismiss
                                </motion.button>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {loading && (
                <motion.div 
                    className="loading-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                        <Loader2 className="spinner" size={48} />
                    </motion.div>
                    <motion.p
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        Verifying...
                    </motion.p>
                </motion.div>
            )}
        </div>
    );
};

export default Scanner;
