// frontend-player/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Player from './pages/Player';
import TriggerBuilder from './pages/TriggerBuilder';
import AiDictionary from './pages/AiDictionary';
import VisualFlowBuilder from './pages/VisualFlowBuilder';

// Komponen Pembantu untuk Navigasi (Mendeteksi halaman aktif)
const NavLink = ({ to, children, special }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    
    // Warna khusus untuk tombol tertentu (seperti Flow Builder)
    const activeColor = special ? '#f59e0b' : '#60a5fa'; // Amber untuk special, Biru untuk standar
    const inactiveColor = '#9ca3af'; // Abu-abu

    return (
        <Link 
            to={to} 
            style={{ 
                color: isActive ? activeColor : inactiveColor, 
                textDecoration: 'none', 
                fontWeight: 'bold',
                borderBottom: isActive ? `2px solid ${activeColor}` : '2px solid transparent',
                paddingBottom: '4px',
                transition: 'all 0.2s'
            }}
        >
            {children}
        </Link>
    );
};

// Komponen Induk Navigasi
const NavigationBar = () => {
    const location = useLocation();
    
    // Sembunyikan navigasi jika sedang berada di rute Player (Layar 2)
    if (location.pathname === '/player') return null;

    return (
        <div style={{ padding: '15px 30px', backgroundColor: '#111827', color: 'white', display: 'flex', gap: '25px', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
            <strong style={{ marginRight: 'auto', fontSize: '20px', letterSpacing: '0.5px' }}>
                📡 Live Auto-System
            </strong>
            
            <NavLink to="/">🎛️ Live Console</NavLink>
            <NavLink to="/ai-dictionary">🧠 Kamus AI</NavLink>
            <NavLink to="/cms">🔗 Mapping Video</NavLink>
            <NavLink to="/flow-builder" special={true}>✨ Visual Flow Builder</NavLink>
            
        </div>
    );
};

export default function App() {
    return (
        <BrowserRouter>
            <NavigationBar />

            <Routes>
                {/* Rute Area Admin (Control Plane) */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/ai-dictionary" element={<AiDictionary />} />
                <Route path="/cms" element={<TriggerBuilder />} />
                <Route path="/flow-builder" element={<VisualFlowBuilder />} />
                
                {/* Rute Khusus Area Tampilan (Data Plane) */}
                <Route 
                    path="/player" 
                    element={
                        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, backgroundColor: 'black' }}>
                            <Player />
                        </div>
                    } 
                />
            </Routes>
        </BrowserRouter>
    );
}