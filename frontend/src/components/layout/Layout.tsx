import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import axios from 'axios';

const TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':    { title: 'Command Deck', subtitle: 'Fleet Operations, Active Lots & Sovereign Ledger' },
  '/map':          { title: 'Supply Chain Map', subtitle: 'Interactive Maritime Chart & Consignment Tracking' },
  '/routes':       { title: 'Logistics Network', subtitle: 'Kenway Shipping Corridors & Regional Hubs' },
  '/products':     { title: 'Products & Batches', subtitle: 'Cargo SKU Registry & Manifest Lots' },
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
    axios.get('http://localhost:3001/health')
      .then(() => setHealth('ONLINE'))
      .catch(() => setHealth('LOCAL EVM'));
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-breadcrumb">
            <span style={{ color: 'var(--text-muted)' }}>FLEET</span>
            <span style={{ color: 'var(--divider)' }}>/</span>
            <span>{meta.title.toUpperCase()}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.4rem' }}>
              — {meta.subtitle}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Quick action buttons */}
            <Link to="/map" className="btn btn-ghost btn-sm" style={{ fontSize: '0.72rem' }}>
              🗺️ Open Chart
            </Link>
            <Link to="/verify" className="btn btn-gold btn-sm" style={{ fontSize: '0.72rem' }}>
              🔍 Verify Token
            </Link>

            {/* Network pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.3rem 0.65rem',
              background: 'rgba(7, 23, 25, 0.9)',
              border: '1px solid var(--divider)',
              borderRadius: '4px',
              fontSize: '0.72rem'
            }}>
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: health === 'ONLINE' ? 'var(--teal)' : 'var(--warning)',
                boxShadow: `0 0 8px ${health === 'ONLINE' ? 'var(--teal)' : 'var(--warning)'}`
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

        {/* Tactical ticker footer */}
        <footer className="ticker-bar" style={{ position: 'fixed', bottom: 0, left: 260, right: 0, zIndex: 30 }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--gold-lit)' }}>⚓ CARIBBEAN FREIGHT CORRIDOR</span>
            <span>EVM TARGET: PARIS 0.8.20</span>
            <span>CONSENSUS: IMMUTABLE STATE MACHINE</span>
          </div>
          <div style={{ color: 'var(--teal)' }}>
            ENCRYPTION: KECCAK-256 ACTIVE
          </div>
        </footer>
      </div>
    </div>
  );
}
