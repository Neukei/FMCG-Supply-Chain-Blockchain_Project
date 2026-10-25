import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBatches, getExpiryAlerts, recallBatch } from '../services/api';
import { Batch } from '../types';
import { formatDate, daysUntilExpiry, shortAddr, statusClass } from '../utils/helpers';
import { useWallet } from '../contexts/WalletContext';

export default function ExpiryRecall() {
  const [recalled, setRecalled]   = useState<Batch[]>([]);
  const [expiring, setExpiring]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<'expiry' | 'recalled'>('expiry');
  const [showRecallModal, setShowRecallModal] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [recallReason, setRecallReason] = useState('Packaging seal integrity alert detected in transit.');
  const [recalling, setRecalling] = useState(false);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);

  const { address } = useWallet();

  function load() {
    setLoading(true);
    Promise.all([
      getBatches({ recalled: 'true' }),
      getExpiryAlerts(),
      getBatches(),
    ])
      .then(([r, e, all]) => {
        setRecalled(r.data.data);
        setExpiring(e.data.data);
        setAllBatches(all.data.data.filter((b: Batch) => !b.is_recalled));
        if (all.data.data.length > 0 && !selectedBatchId) {
          setSelectedBatchId(all.data.data[0].id);
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleExecuteRecall(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBatchId) return;
    setRecalling(true);
    try {
      await recallBatch(selectedBatchId, {
        reason: recallReason,
        caller_address: address,
      });
      setShowRecallModal(false);
      load();
    } catch (err: any) {
      alert(err.message || 'Recall failed');
    } finally {
      setRecalling(false);
    }
  }

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Peril &amp; Emergency Recall Radar</h1>
          <p className="page-subtitle">Perishable expiry radar and cryptographic quarantine locks</p>
        </div>
        <button className="btn btn-danger" onClick={() => setShowRecallModal(true)}>
          ⚠️ Initiate Emergency Lot Recall
        </button>
      </div>

      {/* Emergency Recall Modal */}
      {showRecallModal && (
        <div className="modal-overlay" onClick={() => setShowRecallModal(false)}>
          <div className="modal animate-in" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title" style={{ color: 'var(--error)' }}>⚠️ Emergency Recall Protocol</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Warning: Initiating a batch recall irrevocably transitions the lot and all child units into <code>RECALLED</code>.
              Smart contracts will permanently disallow further transfers or consumer sales.
            </p>
            <form onSubmit={handleExecuteRecall} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label className="label">Target Production Lot *</label>
                <select
                  className="select"
                  value={selectedBatchId}
                  onChange={e => setSelectedBatchId(e.target.value)}
                >
                  {allBatches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.batch_number} — {b.product_name} ({b.quantity} units)
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="label">Recall Justification &amp; Peril Root Cause *</label>
                <textarea
                  className="input"
                  rows={3}
                  value={recallReason}
                  onChange={e => setRecallReason(e.target.value)}
                  placeholder="Detail contamination risk, compromised seal, or temperature breach..."
                />
              </div>

              <div className="gold-divider" />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowRecallModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={recalling}>
                  {recalling ? 'Broadcasting Recall Lock...' : '⚡ Confirm & Seal Recall'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stat meters resembling naval threat counters */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'1.25rem', marginBottom:'1.5rem' }}>
        <div className="card card-featured" style={{ display:'flex', gap:'1.25rem', alignItems:'center' }}>
          <span style={{ fontSize:'2.25rem', filter: 'drop-shadow(0 0 10px rgba(224,93,90,0.5))' }}>🚨</span>
          <div>
            <div style={{ fontFamily:'Cinzel,serif', fontSize:'1.75rem', color:'var(--error)', fontWeight: 700 }}>{recalled.length}</div>
            <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Recalled Lots</div>
          </div>
        </div>
        <div className="card" style={{ display:'flex', gap:'1.25rem', alignItems:'center' }}>
          <span style={{ fontSize:'2.25rem', filter: 'drop-shadow(0 0 10px rgba(220,165,68,0.5))' }}>⏳</span>
          <div>
            <div style={{ fontFamily:'Cinzel,serif', fontSize:'1.75rem', color:'var(--warning)', fontWeight: 700 }}>
              {expiring.filter(e => !e.is_expired).length}
            </div>
            <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Near Expiry (&lt; 30d)</div>
          </div>
        </div>
        <div className="card" style={{ display:'flex', gap:'1.25rem', alignItems:'center' }}>
          <span style={{ fontSize:'2.25rem', filter: 'drop-shadow(0 0 10px rgba(84,209,198,0.5))' }}>🛡️</span>
          <div>
            <div style={{ fontFamily:'Cinzel,serif', fontSize:'1.75rem', color:'var(--teal-bright)', fontWeight: 700 }}>
              {allBatches.length}
            </div>
            <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Active Sound Lots</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.25rem' }}>
        <button className={`btn ${tab === 'expiry' ? 'btn-gold' : 'btn-ghost'} btn-sm`}
          onClick={() => setTab('expiry')}>⏳ Perishable Expiry Alerts ({expiring.length})</button>
        <button className={`btn ${tab === 'recalled' ? 'btn-danger' : 'btn-ghost'} btn-sm`}
          onClick={() => setTab('recalled')}>🚨 Quarantined Lots ({recalled.length})</button>
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
          {[...Array(4)].map((_,i) => <div key={i} className="shimmer" style={{ height:70 }} />)}
        </div>
      ) : tab === 'expiry' ? (
        expiring.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">🛡️</div>
              <div className="empty-state-title">No Near-Expiry Batches</div>
              <div className="empty-state-sub">All monitored consignments have sufficient shelf stability remaining.</div>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="manifest-table">
              <thead>
                <tr><th>Batch Lot</th><th>Product</th><th>Expiry Date</th><th>Horizon Remaining</th><th>Current Custodian</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
              </thead>
              <tbody>
                {expiring.map((b: any) => (
                  <tr key={b.id}>
                    <td><code style={{ fontFamily:'JetBrains Mono,monospace', color:'var(--teal-bright)', fontSize:'0.82rem' }}>{b.batch_number}</code></td>
                    <td style={{ color:'var(--text-main)', fontWeight: 500 }}>{b.product_name}</td>
                    <td style={{ fontSize:'0.78rem', color: 'var(--text-muted)' }}>{formatDate(b.expiry_date)}</td>
                    <td>
                      <span style={{
                        fontFamily:'JetBrains Mono,monospace',
                        color: b.is_expired ? 'var(--error)' : b.days_until_expiry <= 7 ? 'var(--error)' : 'var(--warning)',
                        fontWeight: 700,
                      }}>
                        {b.is_expired ? `EXPIRED (${Math.abs(b.days_until_expiry)}d ago)` : `${b.days_until_expiry} days`}
                      </span>
                    </td>
                    <td><span className="tx-hash">{shortAddr(b.current_owner)}</span></td>
                    <td style={{ textAlign: 'right' }}><Link to={`/batches/${b.id}`} className="btn btn-gold btn-sm">Inspect ➔</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        recalled.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">🛡️</div>
              <div className="empty-state-title">Zero Active Recalls</div>
              <div className="empty-state-sub">No maritime cargo lots are currently undergoing emergency quarantine.</div>
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.85rem' }}>
            {recalled.map(b => (
              <div key={b.id} className="card card-featured" style={{ borderColor: 'var(--error)', background: 'rgba(20, 8, 10, 0.85)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', width:'100%', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontFamily:'Cinzel,serif', fontSize:'1.05rem', color: 'var(--error)', fontWeight: 700, marginBottom:'0.35rem' }}>
                      🚨 RECALLED LOT: {b.batch_number} — {b.product_name}
                    </div>
                    <div style={{ fontSize:'0.82rem', marginBottom:'0.4rem', color: 'var(--text-main)' }}>
                      <strong style={{ color: 'var(--gold-lit)' }}>Declared Reason:</strong> {b.recall_reason || 'Compromised batch integrity.'}
                    </div>
                    <div style={{ fontSize:'0.72rem', color: 'var(--text-muted)' }}>
                      Origin: {shortAddr(b.manufacturer_address)} • Commissioned: {formatDate(b.registered_at)}
                    </div>
                  </div>
                  <Link to={`/batches/${b.id}`} className="btn btn-danger btn-sm" style={{ flexShrink:0 }}>
                    Examine Lot Dossier ➔
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
