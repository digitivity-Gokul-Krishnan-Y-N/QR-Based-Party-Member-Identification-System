
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Printer, Download, RefreshCw, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import API_BASE_URL from '../config/api';
import './QRGenerator.css';

const QRGenerator = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/stats`);
            setMembers(res.data.members || []);
        } catch (err) {
            console.error(err);
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
        } catch (err) {
            console.error("PDF Generation failed:", err);
            alert("Failed to generate PDF. Check console for details.");
        } finally {
            setGenerating(false);
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
            alert('Failed to download QR code. Please try again.');
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
            alert(`Successfully downloaded ${validMembers.length} QR codes!`);
        } catch (err) {
            console.error('Failed to download all QR codes:', err);
            alert('Failed to download all QR codes. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    // Filter members who possess a QR ID
    const validMembers = members.filter(m => m['QR Code ID']);

    return (
        <div className="generator-container">
            <h2 className="title-gradient">QR Code Generator</h2>
            <div className="generator-actions glass-panel">
                <div className="action-info">
                    <UserCheck size={24} color="#3b82f6" />
                    <span>Total Members with IDs: <strong>{validMembers.length}</strong></span>
                </div>
                <div className="action-buttons">
                    <button onClick={fetchMembers} className="action-btn secondary" disabled={loading}>
                        <RefreshCw size={20} className={loading ? 'spin' : ''} /> Refresh
                    </button>
                    <button
                        onClick={downloadAllIndividualQRs}
                        className="action-btn primary"
                        disabled={generating || validMembers.length === 0}
                    >
                        {generating ? 'Downloading...' : <><Download size={20} /> Download All PNGs</>}
                    </button>
                    <button onClick={generatePDF} className="action-btn primary" disabled={generating || validMembers.length === 0}>
                        {generating ? 'Generating PDF...' : <><Printer size={20} /> Download PDF</>}
                    </button>
                </div>
            </div>

            {/* Hidden container for PDF generation - formatted for A4 grid */}
            <div id="qr-preview-container" className="qr-grid-preview">
                {validMembers.map((member, index) => (
                    <motion.div
                        key={index}
                        id={`qr-card-${index}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="qr-card"
                    >
                        <div className="qr-header">
                            <span className="party-name">Sankalp Party</span>
                        </div>
                        <div className="qr-code-wrapper">
                            <QRCodeCanvas
                                value={String(member['QR Code ID'])}
                                size={120}
                                level={"H"}
                                includeMargin={true}
                            />
                        </div>
                        <div className="qr-details">
                            <p className="member-name">{member.Name}</p>
                            <p className="member-role">{member.Designation}</p>
                            <p className="member-id">{member['QR Code ID']}</p>
                            <p className="member-constituency">{member.Constituency} ({member['Constituency Number']})</p>
                        </div>
                        <button
                            className="download-individual-btn"
                            onClick={() => downloadIndividualQR(member, index)}
                            title="Download this QR code"
                        >
                            <Download size={16} /> Download
                        </button>
                    </motion.div>
                ))}
            </div>

            {/* Print Container (Off-screen / Absolute positioned for capture) */}
            <div className="print-hidden-wrapper">
                <div id="qr-print-container" className="print-layout">
                    {validMembers.map((member, index) => (
                        <div key={index} className="print-card">
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
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QRGenerator;
