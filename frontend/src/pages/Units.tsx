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
      .then(([u, b]) => { setUnits(u.data.data); setBatches(b.data.data); })
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
      setForm({ batch_id: '', unit_serial: '' });
      load();
    } catch (e: any) { setFormError(e.message); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Unit Ledger</h1>
          <p className="page-subtitle">Individual product units — each linked to a parent batch</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>⊕ Register Unit</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal animate-in" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">⊕ Register Individual Unit</h3>
            <p style={{ fontSize:'0.78rem', color:'var(--text-dim)', marginBottom:'1rem' }}>
              Assign a unique serial to one physical unit within a batch. Use this for high-value items requiring per-unit tracking.
            </p>
            {formError && <div className="alert alert-danger" style={{ marginBottom:'1rem' }}>{formError}</div>}
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div className="input-group">
                <label className="label">Parent Batch *</label>
                <select className="select" value={form.batch_id}
                  onChange={e => setForm(f => ({...f, batch_id: e.target.value}))}>
                  <option value="">Select batch…</option>
                  {batches.filter(b => !b.is_recalled).map(b => (
                    <option key={b.id} value={b.id}>{b.batch_number} — {b.product_name}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="label">Unit Serial Number *</label>
                <input className="input" placeholder="e.g. UNIT-001 or SN-2024-123456" value={form.unit_serial}
                  onChange={e => setForm(f => ({...f, unit_serial: e.target.value}))} />
              </div>
              <div className="gold-divider" />
              <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '⏳ Registering…' : '⚓ Register Unit'}
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
            <div className="empty-state-title">No Units Registered</div>
            <div className="empty-state-sub">Register individual units within a batch for per-unit tracking.</div>
            <button className="btn btn-gold" style={{ marginTop:'0.5rem' }} onClick={() => setShowForm(true)}>⊕ Register Unit</button>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="manifest-table">
            <thead>
              <tr>
                <th>Serial</th>
                <th>Batch</th>
                <th>Product</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Registered</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {units.map(u => (
                <tr key={u.id}>
                  <td>
                    <code style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.78rem', color:'var(--gold-lit)' }}>
                      {u.unit_serial}
                    </code>
                    {u.is_recalled ? <div style={{ fontSize:'0.6rem', color:'var(--red-lit)', fontFamily:'Cinzel,serif' }}>☠ RECALLED</div> : null}
                  </td>
                  <td>
                    <Link to={`/batches/${u.batch_id}`} style={{ color:'var(--gold-lit)', textDecoration:'none', fontSize:'0.8rem' }}>
                      {u.batch_number}
                    </Link>
                  </td>
                  <td style={{ fontSize:'0.8rem', color:'var(--parchment)' }}>{u.product_name}</td>
                  <td><span className={statusClass(u.is_recalled ? 'RECALLED' : u.status)}>{statusLabel(u.is_recalled ? 'RECALLED' : u.status)}</span></td>
                  <td><span className="tx-hash">{shortAddr(u.current_owner)}</span></td>
                  <td style={{ fontSize:'0.78rem' }}>{formatDate(u.registered_at)}</td>
                  <td>
                    <Link to={`/units/${u.id}`} className="btn btn-ghost btn-sm">View →</Link>
                    <Link to={`/verify/${u.id}`} className="btn btn-ghost btn-sm" style={{ marginLeft:'0.25rem' }}>Verify</Link>
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
