import React from 'react';
import { NavLink } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';
import { chainName } from '../../utils/helpers';

// 9 Modules specified in Master Prompt
const NAV_MODULES = [
  {
    section: 'Navigation',
    links: [
      { to: '/dashboard', label: 'Command Deck', icon: '🧭', badge: null },
      { to: '/map', label: 'Supply Chain Map', icon: '🗺️', badge: 'LIVE' },
      { to: '/routes', label: 'Logistics Network', icon: '🚢', badge: null },
    ]
  },
  {
    section: 'Inventory & Traceability',
    links: [
      { to: '/products', label: 'Products & Batches', icon: '📦', badge: null },
      { to: '/units', label: 'Unit Ledger', icon: '🏷️', badge: null },
      { to: '/transfers', label: 'Shipments & Routes', icon: '⚓', badge: null },
    ]
  },
  {
    section: 'Governance & Trust',
    links: [
      { to: '/expiry', label: 'Quality & Peril', icon: '☠️', badge: 'ALERT' },
      { to: '/audit', label: 'Blockchain Ledger', icon: '🔗', badge: null },
      { to: '/participants', label: 'Crew & Facilities', icon: '👥', badge: null },
      { to: '/verify', label: 'Public Verifier', icon: '🔍', badge: null },
      { to: '/settings', label: 'System Settings', icon: '⚙️', badge: null },
    ]
  }
];

export default function Sidebar() {
  const {
    address,
    chainId,
    isConnected,
    connect,
    disconnect,
    shortAddress,
    isConnecting,
    activeActor,
    switchActor,
    isDemoMode,
  } = useWallet();

  return (
    <aside className="sidebar">
      {/* Top Brand Logo / Maritime Insignia */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 6,
            background: 'linear-gradient(135deg, rgba(89, 197, 187, 0.25) 0%, rgba(205, 187, 114, 0.2) 100%)',
            border: '1px solid var(--gold-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            boxShadow: '0 0 10px rgba(89, 197, 187, 0.25)'
          }}>
            ⚓
          </div>
          <div>
            <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 800, fontSize: '0.92rem', color: 'var(--gold-lit)', letterSpacing: '0.08em' }}>
              FMCG LEDGER
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Maritime Provenance
            </div>
          </div>
        </div>

        {/* Persona & Wallet Status */}
        {isConnected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
            <div style={{
              background: 'rgba(7, 23, 25, 0.85)',
              border: '1px solid var(--gold-border)',
              borderRadius: '4px',
              padding: '0.4rem 0.6rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.62rem' }}>
                <span style={{ color: 'var(--gold)', fontWeight: 600, letterSpacing: '0.05em' }}>OFFICER ROLE</span>
                <span style={{ color: 'var(--teal)', fontSize: '0.6rem' }}>● {isDemoMode ? 'Demo Node' : chainName(chainId)}</span>
              </div>
              <select
                className="select"
                style={{
                  fontSize: '0.72rem',
                  padding: '0.2rem 0.4rem',
                  height: 'auto',
                  background: 'var(--bg-primary)',
                  borderColor: 'var(--divider)',
                  color: 'var(--text-main)',
                  cursor: 'pointer'
                }}
                value={activeActor ? activeActor.key : 'METAMASK'}
                onChange={(e) => {
                  if (e.target.value === 'METAMASK') connect();
                  else switchActor(e.target.value);
                }}
              >
                <option value="MANUFACTURER">🏭 Elena (Manufacturer)</option>
                <option value="DISTRIBUTOR">🚚 Marcus (Distributor)</option>
                <option value="WAREHOUSE">🏢 Sarah (Warehouse)</option>
                <option value="RETAILER">🏪 Rajesh (Retailer)</option>
                <option value="ADMIN">👑 System Admin</option>
                <option value="METAMASK">🦊 Connect Web3 MetaMask</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.2rem' }}>
              <span style={{ fontSize: '0.68rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>
                {shortAddress}
              </span>
              <button
                onClick={disconnect}
                style={{ background: 'transparent', border: 'none', color: 'var(--error)', fontSize: '0.68rem', cursor: 'pointer', padding: 0 }}
                title="Disconnect"
              >
                ✕ Exit
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.35rem' }}>
            <button
              className="btn btn-gold btn-sm"
              style={{ width: '100%' }}
              onClick={connect}
              disabled={isConnecting}
            >
              {isConnecting ? '⏳ Syncing…' : '🔗 Connect Web3'}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', fontSize: '0.7rem' }}
              onClick={() => switchActor('MANUFACTURER')}
            >
              🎭 Simulator Deck
            </button>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <div style={{ flex: 1, padding: '0.5rem 0' }}>
        {NAV_MODULES.map(section => (
          <div className="sidebar-section" key={section.section}>
            <div className="sidebar-section-label">{section.section}</div>
            {section.links.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <span style={{ fontSize: '0.9rem', width: 20, textAlign: 'center' }}>{link.icon}</span>
                <span style={{ flex: 1 }}>{link.label}</span>
                {link.badge && (
                  <span style={{
                    fontSize: '0.58rem',
                    padding: '0.1rem 0.35rem',
                    borderRadius: 3,
                    background: link.badge === 'ALERT' ? 'rgba(217, 107, 104, 0.25)' : 'rgba(89, 197, 187, 0.2)',
                    color: link.badge === 'ALERT' ? 'var(--error)' : 'var(--teal)',
                    border: `1px solid ${link.badge === 'ALERT' ? 'var(--error)' : 'var(--teal)'}`,
                    fontWeight: 700
                  }}>
                    {link.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom Cartographic Footer */}
      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--divider)', fontSize: '0.64rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
          <span style={{ color: 'var(--gold)' }}>SYSTEM PROTOCOL</span>
          <span>v2.4 SEPOLIA</span>
        </div>
        <div>Coordinates: 24°N 78°W Caribbean Corridor</div>
      </div>
    </aside>
  );
}
