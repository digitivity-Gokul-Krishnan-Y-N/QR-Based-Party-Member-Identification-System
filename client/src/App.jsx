
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Scanner from './components/Scanner';
import Admin from './components/Admin';
import Stats from './components/Stats';
import QRGenerator from './components/QRGenerator';
import GatewayManager from './components/GatewayManager';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const location = useLocation();
  
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const pageTransition = {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.4
  };

  return (
    <div className="app-main">
      <Navbar />
      <div className="content-container">
        <AnimatePresence mode='wait'>
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            style={{ width: '100%' }}
          >
            <Routes location={location}>
              <Route path="/" element={<Scanner />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/gateways" element={<GatewayManager />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/generate" element={<QRGenerator />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
