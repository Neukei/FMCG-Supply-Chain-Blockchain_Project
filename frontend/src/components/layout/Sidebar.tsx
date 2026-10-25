import React from 'react';
import { NavLink } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  badge?: string;
  category: 'fleet' | 'cargo' | 'ledger' | 'command';
}

const NAV_ITEMS: NavItem[] = [
  // Fleet & Navigation
  { to: '/dashboard',    label: 'Command Deck',     icon: '⚓', category: 'fleet' },
  { to: '/map',          label: 'Supply Map',       icon: '🗺️', category: 'fleet', badge: 'LIVE' },
  { to: '/routes',       label: 'Kenway Fleet',     icon: '⛵', category: 'fleet' },

  // Cargo & Manifest
  { to: '/products',     label: 'Cargo SKUs',       icon: '📦', category: 'cargo' },
  { to: '/batches',      label: 'Batch Manifest',   icon: '📋', category: 'cargo' },
  { to: '/units',        label: 'Unit Ledger',      icon: '🏷️', category: 'cargo' },
  { to: '/transfers',    label: 'Waybills & Log',   icon: '📜', category: 'cargo' },

  // Ledger & Verification
  { to: '/verify',       label: 'Public Verifier',  icon: '🔍', category: 'ledger' },
  { to: '/audit',        label: 'Sovereign Audit',  icon: '🛡️', category: 'ledger' },
  { to: '/expiry',       label: 'Quality & Peril',  icon: '⚠️', category: 'ledger' },

  // Command & Crew
  { to: '/participants', label: 'Crew Register',    icon: '👥', category: 'command' },
  { to: '/settings',     label: 'Helm Settings',    icon: '⚙️', category: 'command' },
];

export default function Sidebar() {
  const { activeActor, switchActor, isDemoMode, shortAddress } = useWallet();

  const renderSection = (category: 'fleet' | 'cargo' | 'ledger' | 'command', title: string) => {
    const items = NAV_ITEMS.filter(item => item.category === category);
    return (
      <div className="sidebar-section" key={category}>
        <span className="sidebar-section-label">{title}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span style={{ fontSize: '1rem', width: 20, textAlign: 'center' }}>{item.icon}</span>
              <span style={{ flex: 1, letterSpacing: '0.04em' }}>{item.label}</span>
              {item.badge && (
                <span style={{
                  fontSize: '0.58rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  padding: '0.1rem 0.4rem',
                  background: 'rgba(84, 209, 198, 0.2)',
                  color: 'var(--teal-bright)',
                  border: '1px solid var(--teal)',
                  borderRadius: '3px',
                }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    );
  };

  return (
    <aside className="sidebar">
      {/* Black Flag Command Emblem Logo */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(84, 209, 198, 0.25) 0%, rgba(205, 187, 114, 0.15) 100%)',
            border: '1.5px solid var(--gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            boxShadow: '0 0 14px rgba(205, 187, 114, 0.35)',
            flexShrink: 0,
          }}>
            ⚓
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: 'Cinzel, serif',
              fontSize: '0.88rem',
              fontWeight: 700,
              color: 'var(--gold-lit)',
              letterSpacing: '0.12em',
              lineHeight: 1.15,
            }}>
              BLACK FLAG
            </div>
            <div style={{
              fontSize: '0.62rem',
              color: 'var(--teal)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              SUPPLY LEDGER
            </div>
          </div>
        </div>

        {/* Active persona role indicator */}
        <div style={{
          marginTop: '0.5rem',
          padding: '0.55rem 0.65rem',
          background: 'rgba(5, 18, 20, 0.8)',
          border: '1px solid var(--glass-border)',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.62rem', color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              CURRENT HELM:
            </span>
            <span style={{
              fontSize: '0.6rem',
              color: 'var(--teal-bright)',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {shortAddress || '0x7099...79C8'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 140,
            }}>
              {activeActor?.name || 'Captain Elena'}
            </span>
            <span style={{
              fontSize: '0.62rem',
              color: 'var(--gold-lit)',
              border: '1px solid var(--gold-border)',
              padding: '0.1rem 0.35rem',
              borderRadius: '2px',
              fontFamily: 'Cinzel, serif',
            }}>
              {activeActor?.role || 'MANUFACTURER'}
            </span>
          </div>

          {/* Persona selector quick toggle */}
          {isDemoMode && (
            <select
              style={{
                fontSize: '0.68rem',
                background: 'rgba(9, 32, 36, 0.9)',
                border: '1px solid var(--divider)',
                color: 'var(--text-muted)',
                borderRadius: '3px',
                padding: '0.2rem 0.35rem',
                cursor: 'pointer',
              }}
              value={activeActor?.key || 'MANUFACTURER'}
              onChange={e => switchActor(e.target.value)}
            >
              <option value="MANUFACTURER">Captain (Manufacturer)</option>
              <option value="DISTRIBUTOR">First Mate (Distributor)</option>
              <option value="WAREHOUSE">Quartermaster (Warehouse)</option>
              <option value="RETAILER">Merchant (Retailer)</option>
              <option value="ADMIN">Governor (Admin)</option>
            </select>
          )}
        </div>
      </div>

      {/* Navigation Sections */}
      <div style={{ flex: 1, paddingBottom: '2rem' }}>
        {renderSection('fleet', 'I. Fleet Navigation')}
        {renderSection('cargo', 'II. Cargo & Waybills')}
        {renderSection('ledger', 'III. Cryptographic Ledger')}
        {renderSection('command', 'IV. Command & Helm')}
      </div>

      {/* Cartographic Coordinate Ticker */}
      <div style={{
        padding: '0.75rem 1rem',
        borderTop: '1px solid var(--divider)',
        background: 'rgba(3, 11, 13, 0.9)',
        fontSize: '0.65rem',
        fontFamily: 'JetBrains Mono, monospace',
        color: 'var(--text-dim)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.2rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>LAT: 25° 04′ N</span>
          <span>LON: 77° 20′ W</span>
        </div>
        <div style={{ color: 'var(--teal)', fontSize: '0.62rem' }}>
          SECTOR: CARIBBEAN SEA BASIN
        </div>
      </div>
    </aside>
  );
}
