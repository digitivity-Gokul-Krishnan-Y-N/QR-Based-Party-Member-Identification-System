
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Scanner from './components/Scanner';
import Admin from './components/Admin';
import Stats from './components/Stats';
import QRGenerator from './components/QRGenerator';
import GatewayManager from './components/GatewayManager';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  return (
    <div className="app-main">
      <Navbar />
      <div className="content-container">
        <AnimatePresence mode='wait'>
          <Routes>
            <Route path="/" element={<Scanner />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/gateways" element={<GatewayManager />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/generate" element={<QRGenerator />} />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
