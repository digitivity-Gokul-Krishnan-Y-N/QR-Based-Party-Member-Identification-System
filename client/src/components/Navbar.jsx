
import React from 'react';
import { NavLink } from 'react-router-dom';
import { QrCode, ClipboardList, BarChart3, Users } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
    return (
        <nav className="navbar glass-panel">
            <div className="nav-brand">
                <Users size={24} className="brand-icon" />
                <span className="brand-name">Sankalp ID</span>
            </div>
            <ul className="nav-links">
                <li>
                    <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
                        <QrCode size={20} />
                        <span>Scan</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/stats" className={({ isActive }) => isActive ? 'active' : ''}>
                        <BarChart3 size={20} />
                        <span>Stats</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/generate" className={({ isActive }) => isActive ? 'active' : ''}>
                        <QrCode size={20} />
                        <span>Generator</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
                        <ClipboardList size={20} />
                        <span>Admin</span>
                    </NavLink>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;
