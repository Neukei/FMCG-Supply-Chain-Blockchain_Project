import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import axios from 'axios';

const TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':    { title: 'Command Deck', subtitle: 'Fleet Operations, Active Lots & Sovereign Ledger' },
  '/map':          { title: 'Supply Chain Map', subtitle: 'Interactive Maritime Chart & Consignment Tracking' },
  '/routes':       { title: 'Logistics Network', subtitle: 'Kenway Shipping Corridors & Regional Hubs' },
  '/products':     { title: 'Cargo SKUs', subtitle: 'Product Manifest & Master Lot Registry' },
  '/batches':      { title: 'Batch Manifest', subtitle: 'Production Lots & Hierarchical Tracking' },
  '/units':        { title: 'Unit Ledger', subtitle: 'Serialized Single Items & Anti-Counterfeit Credentials' },
  '/transfers':    { title: 'Shipments & Routes', subtitle: 'Ownership Handover & Multilateral Waybills' },
  '/expiry':       { title: 'Quality & Peril', subtitle: 'Perishable Expiry Radar & Emergency Recall Locks' },
  '/audit':        { title: 'Blockchain Ledger', subtitle: 'Cryptographic Audit Trail & Etherscan Verification' },
  '/participants': { title: 'Crew & Facilities', subtitle: 'Ecosystem Participants & Access Matrix' },
  '/verify':       { title: 'Public Cargo Verifier', subtitle: 'Zero-Wallet Consumer Authenticity Terminal' },
  '/settings':     { title: 'System Settings', subtitle: 'Helm Configurations, RPC Endpoints & Oracles' },
};

export default function Layout() {
  const location = useLocation();
  const [health, setHealth] = useState<string>('ONLINE');

  const routeKey = Object.keys(TITLES).find(k => location.pathname.startsWith(k)) || '/dashboard';
  const meta = TITLES[routeKey] || { title: 'Maritime Command', subtitle: 'Traceability Matrix' };

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await axios.get('/health', { timeout: 3000 });
        setHealth('ONLINE');
      } catch {
        try {
          await axios.get('http://127.0.0.1:3001/health', { timeout: 3000 });
          setHealth('ONLINE');
        } catch {
          setHealth('LOCAL EVM');
        }
      }
    };
    checkHealth();
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        {/* Topbar matching Assassin's Creed IV Companion / Fleet Upper Deck */}
        <header className="topbar">
          <div className="topbar-breadcrumb">
            <span style={{ color: 'var(--text-muted)' }}>FLEET</span>
            <span style={{ color: 'var(--divider)' }}>/</span>
            <span>{meta.title.toUpperCase()}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.4rem' }}>
              — {meta.subtitle}
            </span>
          </div>

          {/* Upper Deck Tactical Resources Pill Bar (as seen in AC IV screenshots 3 & 4) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div className="nav-pills-bar">
              <Link to="/map" className={`nav-pill ${location.pathname === '/map' ? 'active' : ''}`}>
                🗺️ World Map
              </Link>
              <Link to="/routes" className={`nav-pill ${location.pathname === '/routes' ? 'active' : ''}`}>
                ⛵ Corridors
              </Link>
              <Link to="/verify" className={`nav-pill ${location.pathname.startsWith('/verify') ? 'active' : ''}`}>
                🔍 Verify
              </Link>
            </div>

            {/* In-Game Resource Indicators (Rum, Sugar, Wood, Metal, Reales) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.25rem 0.75rem',
              background: 'rgba(4, 15, 18, 0.7)',
              border: '1px solid var(--divider)',
              borderRadius: '6px',
            }}>
              <div className="cargo-stat" title="Total Active Batches">
                <span style={{ color: 'var(--gold)' }}>📦</span>
                <span>48 Lots</span>
              </div>
              <div className="cargo-stat" title="Active Transits">
                <span style={{ color: 'var(--teal)' }}>⛵</span>
                <span>12 Routes</span>
              </div>
              <div className="currency-display" title="Cryptographic Reales / Gas Reserve">
                <span>💎</span>
                <span>1252 R</span>
              </div>
            </div>

            {/* Network pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.35rem 0.75rem',
              background: 'rgba(5, 20, 23, 0.9)',
              border: '1px solid var(--glass-border)',
              borderRadius: '4px',
              fontSize: '0.72rem',
            }}>
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: health === 'ONLINE' ? 'var(--teal)' : 'var(--warning)',
                boxShadow: `0 0 10px ${health === 'ONLINE' ? 'var(--teal-bright)' : 'var(--warning)'}`
              }} />
              <span style={{ color: 'var(--text-main)', fontFamily: 'JetBrains Mono, monospace' }}>
                {health}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, paddingBottom: '3rem' }}>
          <Outlet />
        </main>

        {/* Authentic In-Game Bottom Simulation Footer */}
        <footer className="ticker-bar" style={{ position: 'fixed', bottom: 0, left: 270, right: 0, zIndex: 30 }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--gold-lit)' }}>⚓ ANIMS VOYAGE PROTOCOL</span>
            <span>SIMULATION: ONLINE</span>
            <span>SEPOLIA TESTNET: Paris 0.8.20</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--teal-bright)' }}>KECCAK-256 IMMUTABLE STATE</span>
            <span style={{ color: 'var(--text-dim)' }}>PRESS ESC TO RELEASE HELM</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
