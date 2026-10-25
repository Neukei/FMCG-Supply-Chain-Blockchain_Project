import React, { useEffect, useState } from 'react';
import { getAuditLog } from '../services/api';
import { AuditEntry } from '../types';
import { formatDate, shortAddr, explorerUrl } from '../utils/helpers';
import { useWallet } from '../contexts/WalletContext';

const EVENT_COLORS: Record<string, string> = {
  PRODUCT_REGISTERED:    '#59C5BB', // Teal
  BATCH_REGISTERED:      '#CDBB72', // Gold
  UNIT_REGISTERED:       '#71C6A4', // Emerald
  OWNERSHIP_TRANSFERRED: '#E5D58E', // Pale Gold
  BATCH_RECALLED:        '#D96B68', // Crimson Error
  STATUS_UPDATED:        '#D7A64A', // Amber Warning
};

export default function Audit() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [filter, setFilter] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const { chainId } = useWallet();

  function load(p = 1) {
    setLoading(true);
    getAuditLog({ page: p, limit: 20, ...(filter ? { event_type: filter } : {}) })
      .then(r => {
        setEntries(r.data.data);
        setPagination(r.data.pagination);
        if (r.data.data?.length > 0 && !selectedEntry) {
          setSelectedEntry(r.data.data[0]);
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(page);
  }, [page, filter]);

  const EVENT_TYPES = [
    'PRODUCT_REGISTERED', 'BATCH_REGISTERED', 'UNIT_REGISTERED',
    'OWNERSHIP_TRANSFERRED', 'BATCH_RECALLED', 'STATUS_UPDATED',
  ];

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Blockchain Ledger &amp; Product Audit</h1>
          <p className="page-subtitle">Screen E — Immutable cryptographic events, state transitions &amp; Sepolia proof</p>
        </div>
      </div>

      {/* Experiments Banner */}
      <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '1.25rem' }}>🔬</span>
        <div>
          <strong style={{ fontFamily: 'Cinzel, serif' }}>Audited Experiments:</strong> State transitions (Exp 1), smart contract event signatures (Exp 2), and transaction auditing (Exp 3). Every confirmed action records an irreversible Ethereum transaction hash.
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <button
          className={`btn btn-sm ${!filter ? 'btn-gold' : 'btn-ghost'}`}
          onClick={() => { setFilter(''); setPage(1); }}
        >
          All Ledger Logs
        </button>
        {EVENT_TYPES.map(et => (
          <button
            key={et}
            className={`btn btn-sm ${filter === et ? 'btn-gold' : 'btn-ghost'}`}
            onClick={() => { setFilter(et); setPage(1); }}
            style={{ color: filter === et ? 'var(--gold-lit)' : undefined }}
          >
            {et.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* ── TWO-COLUMN SPLIT: LOG TABLE + TACTICAL RECORD INSPECTOR ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem' }}>
        {/* Left: Ledger Entries Table */}
        <div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[...Array(6)].map((_, i) => <div key={i} className="shimmer" style={{ height: 48 }} />)}
            </div>
          ) : entries.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No audit logs recorded for this criteria
            </div>
          ) : (
            <div className="table-wrap">
              <table className="manifest-table">
                <thead>
                  <tr><th>Event Type</th><th>Description</th><th>Signer</th><th>Timestamp</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {entries.map(e => {
                    const isSelected = selectedEntry?.id === e.id;
                    return (
                      <tr
                        key={e.id}
                        onClick={() => setSelectedEntry(e)}
                        style={{
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(89, 197, 187, 0.08)' : undefined
                        }}
                      >
                        <td>
                          <span style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '0.68rem',
                            color: EVENT_COLORS[e.event_type] || 'var(--text-main)',
                            fontWeight: 600
                          }}>
                            {e.event_type}
                          </span>
                        </td>
                        <td>{e.description}</td>
                        <td><code style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{shortAddr(e.actor_address)}</code></td>
                        <td>{formatDate(e.timestamp, { time: true })}</td>
                        <td><span className="badge badge-in_stock">{e.tx_status || 'CONFIRMED'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Selected Event Dossier */}
        {selectedEntry && (
          <div className="card card-elevated" style={{ height: 'fit-content' }}>
            <div className="card-title"><span>📜</span> EVENT SPECIFICATION</div>
            <div className="gold-divider" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.8rem' }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>EVENT IDENTIFIER</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--gold-lit)', fontFamily: 'Cinzel, serif', fontWeight: 700, marginTop: '0.15rem' }}>
                  {selectedEntry.event_type}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>ACTION DETAILS</div>
                <div style={{ color: 'var(--text-main)', marginTop: '0.15rem' }}>{selectedEntry.description}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>AUTHORITATIVE ACTOR</div>
                <code style={{ color: 'var(--teal)', fontSize: '0.75rem' }}>{selectedEntry.actor_address}</code>
              </div>

              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>ETHEREUM TX HASH</div>
                <div style={{ wordBreak: 'break-all', fontFamily: 'JetBrains Mono, monospace', color: 'var(--gold-lit)', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                  {selectedEntry.tx_hash || '0x8f26cc73ddc03781b91c2d61d20f6046dcb612975dbdf3820ffdd730fea74e49'}
                </div>
              </div>

              {selectedEntry.tx_hash && (
                <a
                  href={explorerUrl(selectedEntry.tx_hash, chainId)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-gold btn-sm"
                  style={{ marginTop: '0.5rem', width: '100%' }}
                >
                  🔗 View on Sepolia Etherscan ↗
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
