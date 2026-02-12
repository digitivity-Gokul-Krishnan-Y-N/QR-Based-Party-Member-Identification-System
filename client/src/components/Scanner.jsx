
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
            const msg = err.response?.data?.error || 'Scan Failed';
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
                    returnDetailedScanResult: true
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
            <h2 className="title-gradient" style={{ textAlign: 'center', marginBottom: '1rem' }}>Sankalp Member Scanner</h2>

            <div className="camera-wrapper glass-panel">
                <video ref={videoRef} className="camera-feed"></video>
                <div className="overlay-guide"></div>
                {error && <div className="camera-error">{error}</div>}
            </div>

            <AnimatePresence>
                {scanResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className={`result-card glass-panel ${scanResult.type}`}
                        onClick={resetScan}
                    >
                        {scanResult.type === 'success' ? (
                            <div className="success-content">
                                <CheckCircle size={48} color="#10b981" />
                                <h3>Verified Member</h3>
                                <div className="member-details">
                                    <p><strong>Name:</strong> {scanResult.data.member.Name}</p>
                                    <p><strong>Constituency:</strong> {scanResult.data.member.Constituency}</p>
                                    <p><strong>ID:</strong> {scanResult.data.member['QR Code ID']}</p>
                                </div>
                                <div className="scan-count-badge">
                                    Today's Global Count: {scanResult.data.globalCount}
                                </div>
                                <button className="btn-primary" onClick={resetScan}>Next Scan</button>
                            </div>
                        ) : (
                            <div className="error-content">
                                <XCircle size={48} color="#ef4444" />
                                <h3>{scanResult.message}</h3>
                                {scanResult.member && (
                                    <div className="member-details error">
                                        <p><strong>Name:</strong> {scanResult.member.Name}</p>
                                        <p>Previously Scanned At: {new Date(scanResult.member['Last Scanned At']).toLocaleTimeString()}</p>
                                    </div>
                                )}
                                <button className="btn-primary error-btn" onClick={resetScan}>Dismiss</button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {loading && (
                <div className="loading-overlay">
                    <Loader2 className="spinner" size={48} />
                    <p>Verifying...</p>
                </div>
            )}
        </div>
    );
};

export default Scanner;
