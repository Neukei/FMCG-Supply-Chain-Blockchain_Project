import React from 'react';
import { NavLink } from 'react-router-dom';
import { useWallet, DEMO_ACTORS } from '../../contexts/WalletContext';
import { chainName } from '../../utils/helpers';

const NAV = [
  { section: 'Navigation',    links: [
    { to: '/',             label: 'Port of Entry',     icon: '⚓' },
    { to: '/dashboard',    label: 'Captain\'s Log',    icon: '🗺️' },
  ]},
  { section: 'Cargo Records', links: [
    { to: '/products',     label: 'Product Registry',  icon: '📋' },
    { to: '/batches',      label: 'Batch Manifest',    icon: '📦' },
    { to: '/units',        label: 'Unit Ledger',       icon: '🏷️' },
  ]},
  { section: 'Operations',    links: [
    { to: '/transfers',    label: 'Transfer Crew',     icon: '⚓' },
    { to: '/history',      label: 'Voyage History',    icon: '📜' },
    { to: '/expiry',       label: 'Peril & Recall',    icon: '☠️' },
  ]},
  { section: 'Intelligence',  links: [
    { to: '/verify',       label: 'Verify Cargo',      icon: '🔍' },
    { to: '/audit',        label: 'Transaction Log',   icon: '🔗' },
    { to: '/participants', label: 'Crew Register',     icon: '👥' },
    { to: '/settings',     label: 'Helm & Settings',   icon: '⚙️' },
  ]},
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
    <aside className="sidebar compass-bg">
      {/* Logo / Ship name */}
      <div className="sidebar-logo">
        <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.5rem' }}>
          <span style={{ fontSize:'1.5rem' }}>⚔️</span>
          <div>
            <div className="logo-title">FMCG Chain</div>
            <div className="logo-sub">Supply Manifest</div>
          </div>
        </div>

        {/* Wallet pill */}
        {isConnected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <button
              className="wallet-pill"
              style={{ width:'100%', justifyContent:'space-between' }}
              onClick={disconnect}
              title="Click to disconnect"
            >
              <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                <span className="dot" />
                <span style={{ fontWeight: 600 }}>{shortAddress}</span>
              </div>
              <span style={{ fontSize:'0.6rem', opacity:0.75 }}>
                {isDemoMode ? 'Demo Mode' : chainName(chainId)}
              </span>
            </button>

            {/* Role Switcher */}
            <div style={{
              background: 'rgba(212, 175, 55, 0.08)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: '6px',
              padding: '0.4rem 0.6rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.62rem',
                color: 'var(--gold)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600,
              }}>
                <span>Active Persona</span>
                <span style={{ opacity: 0.8 }}>{activeActor?.role || 'Custom'}</span>
              </div>
              <select
                className="select"
                style={{
                  fontSize: '0.72rem',
                  padding: '0.2rem 0.4rem',
                  height: 'auto',
                  background: 'var(--navy-dark, #0d1527)',
                  color: 'var(--text, #e2e8f0)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '4px',
                }}
                value={activeActor ? activeActor.key : 'METAMASK'}
                onChange={(e) => {
                  if (e.target.value === 'METAMASK') {
                    connect();
                  } else {
                    switchActor(e.target.value);
                  }
                }}
              >
                <option value="MANUFACTURER">🏭 Elena (Manufacturer)</option>
                <option value="DISTRIBUTOR">🚚 Marcus (Distributor)</option>
                <option value="WAREHOUSE">🏢 Sarah (Warehouse)</option>
                <option value="RETAILER">🏪 Rajesh (Retailer)</option>
                <option value="ADMIN">👑 System Admin</option>
                <option value="METAMASK">🦊 Connect MetaMask</option>
              </select>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              className="btn btn-gold btn-sm"
              style={{ width:'100%', justifyContent:'center' }}
              onClick={connect}
              disabled={isConnecting}
            >
              {isConnecting ? '⏳ Connecting…' : '🔗 Connect MetaMask'}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ width:'100%', justifyContent:'center', fontSize: '0.7rem' }}
              onClick={() => switchActor('MANUFACTURER')}
            >
              🎭 Use Demo Persona
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      {NAV.map(section => (
        <div className="sidebar-section" key={section.section}>
          <div className="sidebar-section-label">{section.section}</div>
          {section.links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span style={{ fontSize:'0.9rem' }}>{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </div>
      ))}

      {/* Bottom info */}
      <div style={{ marginTop:'auto', padding:'1rem 0.75rem', borderTop:'1px solid var(--border)', fontSize:'0.65rem', color:'var(--text-dim)' }}>
        <div style={{ fontFamily:'Cinzel, serif', letterSpacing:'0.08em', marginBottom:'0.25rem', color:'var(--gold)' }}>
          FMCG Supply Chain v1.0
        </div>
        <div>Sepolia Testnet / Local EVM</div>
        <div style={{ marginTop:'0.5rem', opacity:0.6 }}>
          Immutable provenance &amp; recall tracking
        </div>
      </div>
    </aside>
  );
}
