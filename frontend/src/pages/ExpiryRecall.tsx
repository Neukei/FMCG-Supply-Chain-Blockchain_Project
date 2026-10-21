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
  const { address }               = useWallet();

  function load() {
    setLoading(true);
    Promise.all([
      getBatches({ recalled: 'true' }),
      getExpiryAlerts(),
    ])
      .then(([r, e]) => { setRecalled(r.data.data); setExpiring(e.data.data); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Peril &amp; Recall</h1>
          <p className="page-subtitle">Expiry monitoring and batch recall management</p>
        </div>
      </div>

      {/* Stat pills */}
      <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
        <div className="card" style={{ padding:'0.75rem 1.25rem', display:'flex', gap:'1rem', alignItems:'center' }}>
          <span style={{ fontSize:'1.5rem' }}>☠️</span>
          <div>
            <div style={{ fontFamily:'Cinzel,serif', fontSize:'1.5rem', color:'#e86060' }}>{recalled.length}</div>
            <div style={{ fontSize:'0.65rem', color:'var(--text-dim)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Recalled Batches</div>
          </div>
        </div>
        <div className="card" style={{ padding:'0.75rem 1.25rem', display:'flex', gap:'1rem', alignItems:'center' }}>
          <span style={{ fontSize:'1.5rem' }}>⏳</span>
          <div>
            <div style={{ fontFamily:'Cinzel,serif', fontSize:'1.5rem', color:'#e8c078' }}>{expiring.filter(e => !e.is_expired).length}</div>
            <div style={{ fontSize:'0.65rem', color:'var(--text-dim)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Near Expiry (30 days)</div>
          </div>
        </div>
        <div className="card" style={{ padding:'0.75rem 1.25rem', display:'flex', gap:'1rem', alignItems:'center' }}>
          <span style={{ fontSize:'1.5rem' }}>⏰</span>
          <div>
            <div style={{ fontFamily:'Cinzel,serif', fontSize:'1.5rem', color:'#e86060' }}>{expiring.filter(e => e.is_expired).length}</div>
            <div style={{ fontSize:'0.65rem', color:'var(--text-dim)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Expired Batches</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem', borderBottom:'1px solid var(--border)', paddingBottom:'0.75rem' }}>
        <button className={`btn ${tab === 'expiry' ? 'btn-gold' : 'btn-ghost'} btn-sm`}
          onClick={() => setTab('expiry')}>⏳ Expiry Alerts ({expiring.length})</button>
        <button className={`btn ${tab === 'recalled' ? 'btn-danger' : 'btn-ghost'} btn-sm`}
          onClick={() => setTab('recalled')}>☠ Recalled Batches ({recalled.length})</button>
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
          {[...Array(4)].map((_,i) => <div key={i} className="shimmer" style={{ height:70 }} />)}
        </div>
      ) : tab === 'expiry' ? (
        expiring.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-title">No Near-Expiry Batches</div>
              <div className="empty-state-sub">All tracked batches have more than 30 days before expiry.</div>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="manifest-table">
              <thead>
                <tr><th>Batch</th><th>Product</th><th>Expiry Date</th><th>Days Left</th><th>Owner</th><th>Action</th></tr>
              </thead>
              <tbody>
                {expiring.map((b: any) => (
                  <tr key={b.id}>
                    <td><code style={{ fontFamily:'JetBrains Mono,monospace', color:'var(--gold-lit)', fontSize:'0.78rem' }}>{b.batch_number}</code></td>
                    <td style={{ color:'var(--parchment)' }}>{b.product_name}</td>
                    <td style={{ fontSize:'0.78rem' }}>{formatDate(b.expiry_date)}</td>
                    <td>
                      <span style={{
                        fontFamily:'Cinzel,serif',
                        color: b.is_expired ? '#e86060' : b.days_until_expiry <= 7 ? '#e86060' : '#e8c078',
                        fontWeight: 600,
                      }}>
                        {b.is_expired ? `${Math.abs(b.days_until_expiry)}d ago` : `${b.days_until_expiry}d`}
                      </span>
                    </td>
                    <td><span className="tx-hash">{shortAddr(b.current_owner)}</span></td>
                    <td><Link to={`/batches/${b.id}`} className="btn btn-ghost btn-sm">View →</Link></td>
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
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-title">No Recalled Batches</div>
              <div className="empty-state-sub">No recalls have been initiated.</div>
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {recalled.map(b => (
              <div key={b.id} className="alert alert-danger" style={{ flexDirection:'column', alignItems:'flex-start' }}>
                <div style={{ display:'flex', justifyContent:'space-between', width:'100%', alignItems:'center' }}>
                  <div>
                    <div style={{ fontFamily:'Cinzel,serif', fontSize:'0.9rem', marginBottom:'0.25rem' }}>
                      ☠ {b.batch_number} — {b.product_name}
                    </div>
                    <div style={{ fontSize:'0.78rem', marginBottom:'0.25rem' }}>
                      <strong>Recall reason:</strong> {b.recall_reason || 'Not specified'}
                    </div>
                    <div style={{ fontSize:'0.72rem', opacity:0.7 }}>
                      Manufacturer: {shortAddr(b.manufacturer_address)} · Registered: {formatDate(b.registered_at)}
                    </div>
                  </div>
                  <Link to={`/batches/${b.id}`} className="btn btn-ghost btn-sm" style={{ flexShrink:0 }}>View Batch →</Link>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Limitation notice */}
      <div className="alert alert-info" style={{ marginTop:'1.5rem' }}>
        ℹ <strong style={{ fontFamily:'Cinzel,serif' }}>Limitation Notice:</strong> Expiry dates reflect what
        was reported by the registered manufacturer. The system cannot independently verify a product's
        actual shelf life or physical condition. Recalls are recorded on-chain but physical product retrieval
        requires off-chain coordination.
      </div>
    </div>
  );
}
