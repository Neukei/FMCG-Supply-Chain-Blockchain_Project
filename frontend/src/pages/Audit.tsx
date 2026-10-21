import React, { useEffect, useState } from 'react';
import { getAuditLog } from '../services/api';
import { AuditEntry } from '../types';
import { formatDate, shortAddr, explorerUrl } from '../utils/helpers';
import { useWallet } from '../contexts/WalletContext';

const EVENT_COLORS: Record<string, string> = {
  PRODUCT_REGISTERED:    '#7ab0e8',
  BATCH_REGISTERED:      '#b08ae8',
  UNIT_REGISTERED:       '#70c890',
  OWNERSHIP_TRANSFERRED: '#e8c078',
  BATCH_RECALLED:        '#e86060',
  STATUS_UPDATED:        '#e8a050',
};

export default function Audit() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]   = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [filter, setFilter] = useState('');
  const { chainId } = useWallet();

  function load(p = 1) {
    setLoading(true);
    getAuditLog({ page: p, limit: 20, ...(filter ? { event_type: filter } : {}) })
      .then(r => {
        setEntries(r.data.data);
        setPagination(r.data.pagination);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(page); }, [page, filter]);

  const EVENT_TYPES = [
    'PRODUCT_REGISTERED','BATCH_REGISTERED','UNIT_REGISTERED',
    'OWNERSHIP_TRANSFERRED','BATCH_RECALLED','STATUS_UPDATED',
  ];

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transaction Log</h1>
          <p className="page-subtitle">Immutable audit trail — all supply chain operations recorded</p>
        </div>
      </div>

      {/* Experiments note */}
      <div className="alert alert-info" style={{ marginBottom:'1rem' }}>
        <span style={{ fontSize:'1.1rem' }}>🔬</span>
        <div>
          <strong style={{ fontFamily:'Cinzel,serif' }}>Experiments 1, 2 &amp; 3:</strong>{' '}
          This log demonstrates state transitions (Exp. 1), smart contract events (Exp. 2),
          and transaction auditing (Exp. 3). On-chain transactions have their hash linked to
          the Sepolia block explorer.
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1rem' }}>
        <button className={`btn ${!filter ? 'btn-gold' : 'btn-ghost'} btn-sm`} onClick={() => { setFilter(''); setPage(1); }}>All</button>
        {EVENT_TYPES.map(et => (
          <button key={et} className={`btn ${filter === et ? 'btn-gold' : 'btn-ghost'} btn-sm`}
            onClick={() => { setFilter(et); setPage(1); }}
            style={{ borderColor: EVENT_COLORS[et] + '50', color: filter === et ? EVENT_COLORS[et] : undefined }}>
            {et.replace(/_/g,' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
          {[...Array(8)].map((_,i) => <div key={i} className="shimmer" style={{ height:52 }} />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔗</div>
            <div className="empty-state-title">No Audit Entries</div>
            <div className="empty-state-sub">Audit entries will appear as supply chain operations are performed.</div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize:'0.75rem', color:'var(--text-dim)', marginBottom:'0.75rem' }}>
            Showing {entries.length} of {pagination.total} entries
          </div>
          <div className="table-wrap">
            <table className="manifest-table">
              <thead>
                <tr><th>Event</th><th>Description</th><th>Actor</th><th>Tx Hash</th><th>Status</th><th>Timestamp</th></tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id}>
                    <td>
                      <span style={{
                        fontFamily:'Cinzel,serif', fontSize:'0.65rem', letterSpacing:'0.08em',
                        color: EVENT_COLORS[e.event_type] || 'var(--text-dim)',
                        padding:'0.15rem 0.4rem', borderRadius:3,
                        background: (EVENT_COLORS[e.event_type] || '#888') + '15',
                        border: `1px solid ${(EVENT_COLORS[e.event_type] || '#888')}30`,
                      }}>
                        {e.event_type.replace(/_/g,' ')}
                      </span>
                    </td>
                    <td style={{ fontSize:'0.8rem', color:'var(--parchment)', maxWidth:280 }}>
                      <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {e.description}
                      </div>
                    </td>
                    <td><span className="tx-hash" title={e.actor_address}>{shortAddr(e.actor_address)}</span></td>
                    <td>
                      {e.tx_hash ? (
                        <a href={explorerUrl(e.tx_hash, chainId)} target="_blank" rel="noreferrer" className="tx-hash">
                          {e.tx_hash.slice(0,12)}…
                        </a>
                      ) : <span style={{ color:'var(--text-dim)', fontSize:'0.72rem' }}>off-chain</span>}
                    </td>
                    <td>
                      <span style={{
                        fontFamily:'Cinzel,serif', fontSize:'0.65rem', letterSpacing:'0.06em',
                        color: e.tx_status === 'CONFIRMED' ? '#70c890' : e.tx_status === 'FAILED' ? '#e86060' : '#e8c078',
                      }}>
                        {e.tx_status}
                      </span>
                    </td>
                    <td style={{ fontSize:'0.75rem', color:'var(--text-dim)' }}>
                      {formatDate(e.timestamp, { time:true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display:'flex', gap:'0.5rem', justifyContent:'center', marginTop:'1rem' }}>
              <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p-1)}>← Prev</button>
              <span style={{ display:'flex', alignItems:'center', fontSize:'0.8rem', color:'var(--text-dim)', padding:'0 0.5rem' }}>
                Page {page} of {pagination.pages}
              </span>
              <button className="btn btn-ghost btn-sm" disabled={page === pagination.pages} onClick={() => setPage(p => p+1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
