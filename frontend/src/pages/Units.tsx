import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUnits, getBatches, createUnit } from '../services/api';
import { Unit, Batch } from '../types';
import { formatDate, shortAddr, statusClass, statusLabel } from '../utils/helpers';
import { useWallet } from '../contexts/WalletContext';

export default function Units() {
  const [units, setUnits]     = useState<Unit[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);
  const { address } = useWallet();

  const [form, setForm] = useState({ batch_id: '', unit_serial: '' });

  function load() {
    setLoading(true);
    Promise.all([getUnits(), getBatches()])
      .then(([u, b]) => {
        setUnits(u.data.data);
        setBatches(b.data.data);
        if (b.data.data.length > 0 && !form.batch_id) {
          setForm(f => ({ ...f, batch_id: b.data.data[0].id }));
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.batch_id || !form.unit_serial) return setFormError('Fill all fields.');
    if (!address) return setFormError('Connect wallet first.');
    setSubmitting(true); setFormError(null);
    try {
      await createUnit({ ...form, manufacturer_address: address });
      setShowForm(false);
      setForm({ batch_id: batches[0]?.id || '', unit_serial: '' });
      load();
    } catch (e: any) { setFormError(e.message); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Serialized Unit Ledger</h1>
          <p className="page-subtitle">Individual physical items linked to parent production lots for consumer anti-counterfeiting</p>
        </div>
        <button className="btn btn-gold" onClick={() => setShowForm(true)}>
          ➕ Mint Unit Serial
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal animate-in" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">🏷️ Register Individual Unit Serial</h3>
            <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:'1rem' }}>
              Assign an authenticated unique serial to a physical container (bottle, carton, packet) within an existing batch.
            </p>
            {formError && <div className="alert alert-danger" style={{ marginBottom:'1rem' }}>{formError}</div>}
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div className="input-group">
                <label className="label">Parent Production Lot *</label>
                <select className="select" value={form.batch_id}
                  onChange={e => setForm(f => ({...f, batch_id: e.target.value}))}>
                  {batches.filter(b => !b.is_recalled).map(b => (
                    <option key={b.id} value={b.id}>{b.batch_number} — {b.product_name}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="label">Unit Serial Identifier *</label>
                <input className="input" placeholder="e.g. SN-CARIB-2026-9021" value={form.unit_serial}
                  onChange={e => setForm(f => ({...f, unit_serial: e.target.value.toUpperCase()}))} />
              </div>
              <div className="gold-divider" />
              <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Registering on EVM...' : '⚓ Commit Serial to Chain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
          {[...Array(5)].map((_,i) => <div key={i} className="shimmer" style={{ height:52 }} />)}
        </div>
      ) : units.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🏷️</div>
            <div className="empty-state-title">No Serialized Units Minted</div>
            <div className="empty-state-sub">Mint unique serials under any active batch lot to generate QR verification tokens.</div>
            <button className="btn btn-gold" style={{ marginTop:'1rem' }} onClick={() => setShowForm(true)}>
              ➕ Mint First Unit
            </button>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="manifest-table">
            <thead>
              <tr>
                <th>Unit Serial Hash</th>
                <th>Parent Batch Lot</th>
                <th>Product Type</th>
                <th>Current Status</th>
                <th>Custodian Wallet</th>
                <th>Registered</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {units.map(u => (
                <tr key={u.id}>
                  <td>
                    <code style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.82rem', color:'var(--teal-bright)' }}>
                      {u.unit_serial}
                    </code>
                    {u.is_recalled && (
                      <div style={{ fontSize:'0.62rem', color:'var(--error)', fontFamily:'Cinzel,serif', fontWeight: 700 }}>
                        ⚠️ RECALLED VIA BATCH
                      </div>
                    )}
                  </td>
                  <td>
                    <Link to={`/batches/${u.batch_id}`} style={{ color:'var(--gold-lit)', textDecoration:'none', fontSize:'0.82rem' }}>
                      {u.batch_number}
                    </Link>
                  </td>
                  <td style={{ fontSize:'0.82rem', color:'var(--text-main)', fontWeight: 500 }}>{u.product_name}</td>
                  <td>
                    <span className={statusClass(u.is_recalled ? 'RECALLED' : u.status)}>
                      {statusLabel(u.is_recalled ? 'RECALLED' : u.status)}
                    </span>
                  </td>
                  <td><span className="tx-hash">{shortAddr(u.current_owner)}</span></td>
                  <td style={{ fontSize:'0.78rem', color: 'var(--text-muted)' }}>{formatDate(u.registered_at)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Link to={`/verify/${u.id}`} className="btn btn-primary btn-sm">
                      🔍 Verify QR
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
