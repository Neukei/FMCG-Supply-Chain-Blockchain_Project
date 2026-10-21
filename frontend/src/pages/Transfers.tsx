import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTransfers } from '../services/api';
import { Transfer } from '../types';
import { formatDate, shortAddr, statusClass, statusLabel, explorerUrl } from '../utils/helpers';
import { useWallet } from '../contexts/WalletContext';

export default function Transfers() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'batch' | 'unit'>('all');
  const { chainId } = useWallet();

  useEffect(() => {
    setLoading(true);
    getTransfers(filter !== 'all' ? { item_type: filter } : undefined)
      .then(r => setTransfers(r.data.data))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transfer Operations</h1>
          <p className="page-subtitle">Complete ownership transfer log across the supply chain</p>
        </div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          {(['all','batch','unit'] as const).map(f => (
            <button key={f} className={`btn ${filter === f ? 'btn-gold' : 'btn-ghost'} btn-sm`}
              onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f === 'batch' ? '📦 Batches' : '🏷️ Units'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
          {[...Array(6)].map((_,i) => <div key={i} className="shimmer" style={{ height:52 }} />)}
        </div>
      ) : transfers.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">⚓</div>
            <div className="empty-state-title">No Transfers Recorded</div>
            <div className="empty-state-sub">Ownership transfers will appear here as products move through the supply chain.</div>
          </div>
        </div>
      ) : (
        <>
          <div className="alert alert-info" style={{ marginBottom:'1rem' }}>
            ℹ Showing {transfers.length} transfer{transfers.length !== 1 ? 's' : ''}. 
            Transfers recorded in the database; on-chain transactions require wallet signing.
          </div>
          <div className="table-wrap">
            <table className="manifest-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Shipment Ref</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map(t => (
                  <tr key={t.id}>
                    <td>
                      <Link to={`/${t.item_type === 'batch' ? 'batches' : 'units'}/${t.item_id}`}
                        style={{ color:'var(--gold-lit)', textDecoration:'none', fontFamily:'JetBrains Mono,monospace', fontSize:'0.72rem' }}>
                        {t.item_id.slice(0, 12)}…
                      </Link>
                    </td>
                    <td>
                      <span style={{ fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.08em',
                        color: t.item_type === 'batch' ? '#7ab0e8' : '#b08ae8' }}>
                        {t.item_type === 'batch' ? '📦' : '🏷️'} {t.item_type}
                      </span>
                    </td>
                    <td><span className="tx-hash" title={t.from_address}>{shortAddr(t.from_address)}</span></td>
                    <td><span style={{ color:'var(--parchment)', fontFamily:'JetBrains Mono,monospace', fontSize:'0.78rem' }} title={t.to_address}>{shortAddr(t.to_address)}</span></td>
                    <td style={{ fontSize:'0.78rem', color:'var(--text-dim)' }}>{t.shipment_ref || '—'}</td>
                    <td><span className={statusClass(t.status_after)}>{statusLabel(t.status_after)}</span></td>
                    <td style={{ fontSize:'0.78rem' }}>{formatDate(t.timestamp, { time:true })}</td>
                    <td>
                      {t.tx_hash ? (
                        <a href={explorerUrl(t.tx_hash, chainId)} target="_blank" rel="noreferrer" className="tx-hash">
                          {t.tx_hash.slice(0,10)}…
                        </a>
                      ) : <span style={{ color:'var(--text-dim)', fontSize:'0.72rem' }}>Off-chain</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
