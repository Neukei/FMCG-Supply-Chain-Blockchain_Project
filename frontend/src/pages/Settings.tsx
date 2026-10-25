import React, { useState, useEffect } from 'react';
import { useWallet, DEMO_ACTORS } from '../contexts/WalletContext';
import { chainName, shortAddr } from '../utils/helpers';
import axios from 'axios';

export default function Settings() {
  const { address, chainId, isConnected, isDemoMode, activeActor, switchActor } = useWallet();
  const [backendHealth, setBackendHealth] = useState<any>(null);
  const [pinging, setPinging] = useState(false);
  const [copied, setCopied] = useState(false);

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
          <p className="page-subtitle">Network status, smart contract bindings, persona settings &amp; integrity disclaimers</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={checkHealth} disabled={pinging}>
          {pinging ? '📡 Pinging…' : '🔄 Refresh Health'}
        </button>
      </div>

      {/* Network & Node Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🌐</span>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Blockchain Environment</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Ethereum Virtual Machine (EVM) Connection</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-dim)' }}>Target Network</span>
              <span style={{ fontWeight: 600, color: 'var(--gold-lit)' }}>{chainName(chainId)} (Chain ID: {chainId || 31337})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-dim)' }}>Provider Mode</span>
              <span className={`badge ${isDemoMode ? 'badge-in-stock' : 'badge-registered'}`}>
                {isDemoMode ? '🎭 Demo Mode (Local EVM)' : '🦊 Web3 MetaMask'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-dim)' }}>Active Signer</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--parchment)' }}>
                {address ? shortAddr(address) : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.4rem' }}>📜</span>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Smart Contract</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>FMCGSupplyChain.sol Core Logic</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div>
              <div style={{ color: 'var(--text-dim)', marginBottom: '0.25rem' }}>Contract Address</div>
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '0.4rem 0.6rem',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ color: 'var(--gold)' }}>{contractAddress}</span>
                <button
                  onClick={copyContract}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  {copied ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-dim)' }}>Compiler &amp; Target</span>
              <span style={{ color: 'var(--text)' }}>Solidity 0.8.20 (Paris EVM)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)' }}>Backend Engine</span>
              <span style={{ color: backendHealth?.status === 'ok' ? '#70c890' : '#e86060' }}>
                {backendHealth?.status === 'ok' ? '🟢 Online (SQLite WAL)' : '🔴 Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Persona Role Switcher */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Multi-Stakeholder Persona Switcher</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
          Test the entire decentralized supply chain journey across all authorized roles from a single browser session:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {Object.values(DEMO_ACTORS).map(actor => {
            const isSelected = activeActor?.key === actor.key;
            return (
              <div
                key={actor.key}
                onClick={() => switchActor(actor.key)}
                style={{
                  background: isSelected ? 'rgba(201, 165, 78, 0.15)' : 'rgba(10, 15, 30, 0.6)',
                  border: isSelected ? '1px solid var(--gold)' : '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 600, color: isSelected ? 'var(--gold-lit)' : 'var(--text)' }}>
                    {actor.role}
                  </span>
                  {isSelected && <span style={{ fontSize: '0.7rem', color: 'var(--gold)' }}>● Active</span>}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--parchment)' }}>{actor.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{actor.company}</div>
                <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--gold-dim)', marginTop: '0.4rem' }}>
                  {shortAddr(actor.address)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Critical Blockchain Physical Limitations Disclaimer */}
      <div className="alert alert-warning">
        <span style={{ fontSize: '1.5rem' }}>⚠️</span>
        <div>
          <h4 style={{ fontFamily: 'Cinzel, serif', fontSize: '0.9rem', color: 'var(--gold-lit)', margin: '0 0 0.35rem 0' }}>
            System Integrity &amp; Physical Blockchain Limitations (Oracle Problem)
          </h4>
          <p style={{ fontSize: '0.8rem', lineHeight: 1.5, margin: 0, color: 'var(--text)' }}>
            This system creates an immutable, tamper-evident cryptographic ledger of recorded FMCG supply chain events.
            However, <strong>blockchain technology cannot independently verify physical reality</strong>:
          </p>
          <ul style={{ fontSize: '0.78rem', lineHeight: 1.6, marginTop: '0.4rem', paddingLeft: '1.25rem', color: 'var(--parchment)' }}>
            <li>A genuine QR code or cryptographic serial can be physically copied and printed onto counterfeit packaging.</li>
            <li>Manufacturing dates and expiry dates reflect the values reported by the authorized manufacturer at registration time.</li>
            <li>Storage conditions (such as cold-chain temperature breaches) require certified IoT sensor oracles to be reflected on-chain.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
