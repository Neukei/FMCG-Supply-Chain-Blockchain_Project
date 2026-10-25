import React, { useState, useEffect } from 'react';
import { useWallet, DEMO_ACTORS } from '../contexts/WalletContext';
import { chainName, shortAddr } from '../utils/helpers';
import axios from 'axios';

export default function Settings() {
  const { address, chainId, isConnected, isDemoMode, activeActor, switchActor } = useWallet();
  const [backendHealth, setBackendHealth] = useState<any>(null);
  const [pinging, setPinging] = useState(false);
  const [copied, setCopied] = useState(false);

  // 7 Tabs specified in Master Prompt Screen F
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'PROFILE' | 'ROLES' | 'NOTIFICATIONS' | 'BLOCKCHAIN' | 'INTEGRATIONS' | 'APPEARANCE'>('GENERAL');

  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  function checkHealth() {
    setPinging(true);
    axios.get(`${backendUrl}/health`)
      .then(res => setBackendHealth(res.data))
      .catch(err => setBackendHealth({ status: 'error', message: err.message }))
      .finally(() => setPinging(false));
  }

  useEffect(() => {
    checkHealth();
  }, []);

  function copyContract() {
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Helm &amp; System Configuration</h1>
          <p className="page-subtitle">Clean tabbed administration — smart contracts, access roles &amp; oracle network</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={checkHealth} disabled={pinging}>
          {pinging ? '📡 Pinging…' : '🔄 Refresh Health'}
        </button>
      </div>

      {/* ── SEVEN CLEAN TABS (Screen F Specification) ── */}
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        borderBottom: '1px solid var(--divider)',
        paddingBottom: '0.75rem',
        marginBottom: '1.5rem',
        overflowX: 'auto'
      }}>
        {[
          { key: 'GENERAL', label: 'General Helm' },
          { key: 'PROFILE', label: 'Officer Profile' },
          { key: 'ROLES', label: 'Roles & Permissions' },
          { key: 'NOTIFICATIONS', label: 'Hazard Alerts' },
          { key: 'BLOCKCHAIN', label: 'Blockchain Network' },
          { key: 'INTEGRATIONS', label: 'Oracles & Storage' },
          { key: 'APPEARANCE', label: 'Nautical Ambiance' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`btn btn-sm ${activeTab === t.key ? 'btn-gold' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: General */}
      {activeTab === 'GENERAL' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
          <div className="card">
            <div className="card-title"><span>⚓</span> FMCG SYSTEM RUNTIME</div>
            <div className="gold-divider" />
            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--divider)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Consensus Engine</span>
                <span style={{ color: 'var(--gold-lit)', fontWeight: 600 }}>Hardhat EVM / Ethereum Sepolia</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--divider)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Off-Chain Cache</span>
                <span style={{ color: 'var(--teal)' }}>Node SQLite (WAL Concurrency)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>API Server Gateway</span>
                <span>{backendUrl}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title"><span>⚠️</span> ORACLE &amp; PHYSICAL BOUNDARIES</div>
            <div className="gold-divider" />
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Blockchain secures digital event immutability. Physical verification (e.g., verifying that a QR code sticker was not duplicated onto counterfeit packaging or that cold-room temperatures were preserved) requires external sensory oracles.
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Profile */}
      {activeTab === 'PROFILE' && (
        <div className="card card-elevated" style={{ maxWidth: 640 }}>
          <div className="card-title"><span>👤</span> ACTIVE SIGNER IDENTITY</div>
          <div className="gold-divider" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.82rem' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Officer Designation</div>
              <div style={{ fontSize: '1.1rem', color: 'var(--gold-lit)', fontFamily: 'Cinzel, serif', fontWeight: 700 }}>
                {activeActor?.name || 'Authorized Supply Officer'}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Organization</div>
              <div style={{ color: 'var(--text-main)' }}>{activeActor?.company || 'General Marine Consignment'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Public Key Wallet Address</div>
              <code style={{ color: 'var(--teal)', fontSize: '0.78rem' }}>{address || '0x...'}</code>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Roles & Permissions */}
      {activeTab === 'ROLES' && (
        <div className="card">
          <div className="card-title"><span>👥</span> ACCESS CONTROL MATRIX (OpenZeppelin)</div>
          <div className="gold-divider" />
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Select an authorized persona to test multi-stakeholder handovers across the maritime supply chain:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {Object.values(DEMO_ACTORS).map(actor => {
              const isSelected = activeActor?.key === actor.key;
              return (
                <div
                  key={actor.key}
                  onClick={() => switchActor(actor.key)}
                  style={{
                    background: isSelected ? 'var(--bg-panel-elev)' : 'rgba(7, 23, 25, 0.7)',
                    border: isSelected ? '1px solid var(--gold)' : '1px solid var(--divider)',
                    borderRadius: 6,
                    padding: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Cinzel, serif', color: isSelected ? 'var(--gold-lit)' : 'var(--text-main)', fontWeight: 600 }}>
                      {actor.role}
                    </span>
                    {isSelected && <span style={{ color: 'var(--teal)', fontSize: '0.7rem' }}>● Active</span>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{actor.name}</div>
                  <div style={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--gold-dim)', marginTop: '0.4rem' }}>
                    {shortAddr(actor.address)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Notifications */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-title"><span>⏳</span> PERIL &amp; SHELF-LIFE NOTIFICATION RULES</div>
          <div className="gold-divider" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-main)' }}>
              <input type="checkbox" defaultChecked />
              <span>Flag batches expiring within 30 days on Command Deck</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-main)' }}>
              <input type="checkbox" defaultChecked />
              <span>Broadcast immediate red alert upon emergency recall trigger</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-main)' }}>
              <input type="checkbox" defaultChecked />
              <span>Notify recipient wallet upon waypoint departure</span>
            </label>
          </div>
        </div>
      )}

      {/* Tab 5: Blockchain */}
      {activeTab === 'BLOCKCHAIN' && (
        <div className="card" style={{ maxWidth: 680 }}>
          <div className="card-title"><span>⛓️</span> SMART CONTRACT BINDINGS &amp; RPC</div>
          <div className="gold-divider" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.8rem' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Core Contract Address</div>
              <div style={{
                background: 'rgba(7, 23, 25, 0.8)',
                padding: '0.5rem 0.75rem',
                borderRadius: 4,
                border: '1px solid var(--divider)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <code style={{ color: 'var(--gold-lit)' }}>{contractAddress}</code>
                <button onClick={copyContract} className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.5rem' }}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--divider)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Target Network</span>
              <span style={{ color: 'var(--teal)' }}>{chainName(chainId)} (Chain ID: {chainId || 31337})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Solidity Compiler Target</span>
              <span>Paris 0.8.20 (Optimizer: 200 Runs)</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Integrations */}
      {activeTab === 'INTEGRATIONS' && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-title"><span>📡</span> OFF-CHAIN INDEXER &amp; STORAGE</div>
          <div className="gold-divider" />
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Dual-layer architecture verified: Event listener synchronizes on-chain Ethereum events (`ProductRegistered`, `BatchRegistered`, `OwnershipTransferred`, `BatchRecalled`) into SQLite WAL cache.
          </div>
        </div>
      )}

      {/* Tab 7: Appearance */}
      {activeTab === 'APPEARANCE' && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-title"><span>🎨</span> MARITIME AMBIANCE THEME</div>
          <div className="gold-divider" />
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Theme: <strong>Assassin's Creed IV: Black Flag Command Interface</strong><br />
            Colors: Deep Caribbean Trench (`#071719`), Nautical Slate (`#0B2528`), Smoked Glass (`#102F32`), Brass Gold (`#CDBB72`), Teal Glow (`#59C5BB`).
          </div>
        </div>
      )}
    </div>
  );
}
