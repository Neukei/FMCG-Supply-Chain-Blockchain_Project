import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';
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
  ]},
];

export default function Sidebar() {
  const { address, chainId, isConnected, connect, disconnect, shortAddress, isConnecting } = useWallet();
  const location = useLocation();

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
          <button className="wallet-pill" style={{ width:'100%', justifyContent:'space-between' }} onClick={disconnect}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
              <span className="dot" />
              <span>{shortAddress}</span>
            </div>
            <span style={{ fontSize:'0.6rem', opacity:0.6 }}>{chainName(chainId)}</span>
          </button>
        ) : (
          <button className="btn btn-gold btn-sm" style={{ width:'100%', justifyContent:'center' }}
            onClick={connect} disabled={isConnecting}>
            {isConnecting ? '⏳ Connecting…' : '🔗 Connect Wallet'}
          </button>
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
        <div style={{ fontFamily:'Cinzel, serif', letterSpacing:'0.08em', marginBottom:'0.25rem' }}>
          FMCG Supply Chain v1.0
        </div>
        <div>Blockchain: Sepolia Testnet</div>
        <div style={{ marginTop:'0.5rem', opacity:0.5 }}>
          "Not all treasure is silver and gold, mate."
        </div>
      </div>
    </aside>
  );
}
