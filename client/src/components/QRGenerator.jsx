
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Printer, Download, RefreshCw, UserCheck, AlertCircle, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE_URL from '../config/api';
import './QRGenerator.css';

const QRGenerator = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    const fetchMembers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_BASE_URL}/stats`);
            setMembers(res.data.members || []);
        } catch (err) {
            console.error("Failed to fetch members:", {
                status: err.response?.status,
                message: err.message,
                url: `${API_BASE_URL}/stats`
            });
            setError('Failed to load member data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const generatePDF = async () => {
        setGenerating(true);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const container = document.getElementById('qr-print-container');

        try {
            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save('member_qr_codes.pdf');
            setToast({ type: 'success', message: 'PDF downloaded successfully!' });
        } catch (err) {
            console.error("PDF Generation failed:", err);
            setToast({ type: 'error', message: 'Failed to generate PDF. Check console for details.' });
        } finally {
            setGenerating(false);
            setTimeout(() => setToast(null), 3000);
        }
    };

    const downloadIndividualQR = async (member, index) => {
        try {
            // Get the specific card element
            const cardElement = document.getElementById(`qr-card-${index}`);
            if (!cardElement) {
                console.error('Card element not found');
                return;
            }

            // Create canvas from the card
            const canvas = await html2canvas(cardElement, {
                scale: 3,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            // Convert to blob and download
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const fileName = `QR_${member['QR Code ID']}_${member.Name.replace(/\s+/g, '_')}.png`;
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 'image/png');
        } catch (err) {
            console.error('Failed to download QR code:', err);
            setToast({ type: 'error', message: 'Failed to download QR code. Please try again.' });
            setTimeout(() => setToast(null), 3000);
        }
    };

    const downloadAllIndividualQRs = async () => {
        setGenerating(true);
        try {
            for (let i = 0; i < validMembers.length; i++) {
                const member = validMembers[i];
                const cardElement = document.getElementById(`qr-card-${i}`);

                if (!cardElement) continue;

                const canvas = await html2canvas(cardElement, {
                    scale: 3,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });

                await new Promise((resolve) => {
                    canvas.toBlob((blob) => {
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        const fileName = `QR_${member['QR Code ID']}_${member.Name.replace(/\s+/g, '_')}.png`;
                        link.href = url;
                        link.download = fileName;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);

                        // Small delay between downloads
                        setTimeout(resolve, 300);
                    }, 'image/png');
                });
            }
            setToast({ type: 'success', message: `Successfully downloaded ${validMembers.length} QR codes!` });
        } catch (err) {
            console.error('Failed to download all QR codes:', err);
            setToast({ type: 'error', message: 'Failed to download all QR codes. Please try again.' });
        } finally {
            setGenerating(false);
            setTimeout(() => setToast(null), 3000);
        }
    };

    // Filter members who possess a QR ID
    const validMembers = members.filter(m => m['QR Code ID']);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
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
            className="generator-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <motion.h2 
                className="title-gradient"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                QR Code Generator
            </motion.h2>

            <motion.div 
                className="generator-actions glass-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                whileHover={{ boxShadow: '0 10px 40px rgba(59, 130, 246, 0.2)' }}
            >
                <motion.div 
                    className="action-info"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <UserCheck size={24} color="#3b82f6" />
                    </motion.div>
                    <span>Total Members with IDs: <strong>{validMembers.length}</strong></span>
                </motion.div>
                <div className="action-buttons">
                    <motion.button 
                        onClick={fetchMembers} 
                        className="action-btn secondary" 
                        disabled={loading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <motion.div
                            animate={loading ? { rotate: 360 } : {}}
                            transition={loading ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
                            style={{ display: 'inline-block' }}
                        >
                            <RefreshCw size={20} />
                        </motion.div>
                        Refresh
                    </motion.button>
                    <motion.button
                        onClick={downloadAllIndividualQRs}
                        className="action-btn primary"
                        disabled={generating || validMembers.length === 0}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {generating ? (
                            <motion.span
                                animate={{ opacity: [0.7, 1, 0.7] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                Downloading...
                            </motion.span>
                        ) : (
                            <>
                                <Download size={20} /> Download All PNGs
                            </>
                        )}
                    </motion.button>
                    <motion.button 
                        onClick={generatePDF} 
                        className="action-btn primary" 
                        disabled={generating || validMembers.length === 0}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {generating ? (
                            <motion.span
                                animate={{ opacity: [0.7, 1, 0.7] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                Generating PDF...
                            </motion.span>
                        ) : (
                            <>
                                <Printer size={20} /> Download PDF
                            </>
                        )}
                    </motion.button>
                </div>
            </motion.div>

            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className={`toast ${toast.type}`}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hidden container for PDF generation - formatted for A4 grid */}
            {loading ? (
                <motion.div
                    className="qr-grid-preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div className="loading-state">
                        <RefreshCw size={40} className="loading-spinner" />
                        <p>Loading QR codes...</p>
                    </div>
                </motion.div>
            ) : validMembers.length === 0 ? (
                <motion.div
                    className="qr-grid-preview"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <Inbox size={48} />
                        </div>
                        <h3 className="empty-state-title">No Members with QR Code IDs</h3>
                        <p className="empty-state-message">Upload a file with members in the Admin panel to generate QR codes</p>
                    </div>
                </motion.div>
            ) : (
                <motion.div 
                    id="qr-preview-container" 
                    className="qr-grid-preview"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {validMembers.map((member, index) => (
                        <motion.div
                            key={index}
                            id={`qr-card-${index}`}
                            variants={itemVariants}
                            className="qr-card"
                            whileHover={{ 
                                scale: 1.02,
                                boxShadow: '0 10px 30px rgba(59, 130, 246, 0.2)',
                                y: -5
                            }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        >
                            <motion.div 
                                className="qr-header"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                <span className="party-name">Sankalp Party</span>
                            </motion.div>
                            <motion.div 
                                className="qr-code-wrapper"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                whileHover={{ scale: 1.1 }}
                            >
                                <QRCodeCanvas
                                    value={String(member['QR Code ID'])}
                                    size={120}
                                    level={"H"}
                                    includeMargin={true}
                                />
                            </motion.div>
                            <motion.div 
                                className="qr-details"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <p className="member-name">{member.Name}</p>
                                <p className="member-role">{member.Designation}</p>
                                <p className="member-id">{member['QR Code ID']}</p>
                                <p className="member-constituency">{member.Constituency}</p>
                            </motion.div>
                            <motion.button
                                className="download-individual-btn"
                                onClick={() => downloadIndividualQR(member, index)}
                                title="Download this QR code"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <Download size={16} /> Download
                            </motion.button>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Print Container (Off-screen / Absolute positioned for capture) */}
            <div className="print-hidden-wrapper">
                <div id="qr-print-container" className="print-layout">
                    {validMembers.map((member, index) => (
                        <motion.div
                            key={index}
                            className="print-card"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.02 }}
                        >
                            <div className="print-header">Sankalp ID Card</div>
                            <div className="print-qr">
                                <QRCodeCanvas
                                    value={String(member['QR Code ID'])}
                                    size={100}
                                    level={"H"}
                                />
                            </div>
                            <div className="print-details">
                                <div className="print-name">{member.Name}</div>
                                <div className="print-role">{member.Designation}</div>
                                <div className="print-meta">{member.Constituency}</div>
                                <div className="print-id">{member['QR Code ID']}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default QRGenerator;
