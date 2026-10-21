import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBatches, getProducts, createBatch } from '../services/api';
import { Batch, ProductType } from '../types';
import { formatDate, shortAddr, statusClass, statusLabel, daysUntilExpiry, formatQty } from '../utils/helpers';
import { useWallet } from '../contexts/WalletContext';

export default function Batches() {
  const [batches, setBatches]   = useState<Batch[]>([]);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { address } = useWallet();

  const [form, setForm] = useState({
    product_type_id: '', batch_number: '',
    manufacturing_date: '', expiry_date: '',
    quantity: '', packaging_type: '',
  });

  function load() {
    setLoading(true);
    Promise.all([getBatches(), getProducts()])
      .then(([b, p]) => { setBatches(b.data.data); setProducts(p.data.data); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.product_type_id || !form.batch_number || !form.manufacturing_date || !form.quantity)
      return setFormError('Fill all required fields.');
    if (!address) return setFormError('Connect wallet first.');
    setSubmitting(true);
    try {
      const mfgTs  = Math.floor(new Date(form.manufacturing_date).getTime() / 1000);
      const expTs  = form.expiry_date ? Math.floor(new Date(form.expiry_date).getTime() / 1000) : 0;
      if (expTs && expTs <= mfgTs) return setFormError('Expiry must be after manufacturing date.');
      await createBatch({
        ...form, manufacturing_date: mfgTs, expiry_date: expTs,
        quantity: parseInt(form.quantity), manufacturer_address: address,
      });
      setShowForm(false);
      setForm({ product_type_id:'', batch_number:'', manufacturing_date:'', expiry_date:'', quantity:'', packaging_type:'' });
      load();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const PKG_TYPES = ['Carton','Pallet','Case','Box','Crate','Drum','Bag','Bundle'];

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Batch Manifest</h1>
          <p className="page-subtitle">Production batches — each holds multiple individual units</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>⊕ Register Batch</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal animate-in" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">⊕ Register Production Batch</h3>
            {formError && <div className="alert alert-danger" style={{ marginBottom:'1rem' }}>{formError}</div>}
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div className="input-group">
                <label className="label">Product Type *</label>
                <select className="select" value={form.product_type_id}
                  onChange={e => setForm(f => ({...f, product_type_id: e.target.value}))}>
                  <option value="">Select product…</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku_code})</option>)}
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div className="input-group">
                  <label className="label">Batch Number *</label>
                  <input className="input" placeholder="e.g. LC-2024-001" value={form.batch_number}
                    onChange={e => setForm(f => ({...f, batch_number: e.target.value}))} />
                </div>
                <div className="input-group">
                  <label className="label">Quantity (units) *</label>
                  <input className="input" type="number" min="1" placeholder="e.g. 10000" value={form.quantity}
                    onChange={e => setForm(f => ({...f, quantity: e.target.value}))} />
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div className="input-group">
                  <label className="label">Manufacturing Date *</label>
                  <input className="input" type="date" value={form.manufacturing_date}
                    onChange={e => setForm(f => ({...f, manufacturing_date: e.target.value}))} />
                </div>
                <div className="input-group">
                  <label className="label">Expiry Date</label>
                  <input className="input" type="date" value={form.expiry_date}
                    onChange={e => setForm(f => ({...f, expiry_date: e.target.value}))} />
                </div>
              </div>
              <div className="input-group">
                <label className="label">Packaging Type</label>
                <select className="select" value={form.packaging_type}
                  onChange={e => setForm(f => ({...f, packaging_type: e.target.value}))}>
                  <option value="">Select packaging…</option>
                  {PKG_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="gold-divider" />
              <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '⏳ Registering…' : '⚓ Register Batch'}
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
      ) : batches.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-title">No Batches in Manifest</div>
            <div className="empty-state-sub">Register your first production batch.</div>
            <button className="btn btn-gold" style={{ marginTop:'0.5rem' }} onClick={() => setShowForm(true)}>
              ⊕ Register Batch
            </button>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="manifest-table">
            <thead>
              <tr>
                <th>Batch No.</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Mfg Date</th>
                <th>Expiry</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(b => {
                const exp = b.expiry_date ? daysUntilExpiry(b.expiry_date) : null;
                return (
                  <tr key={b.id}>
                    <td>
                      <div style={{ display:'flex', flexDirection:'column', gap:'0.1rem' }}>
                        <code style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.78rem', color:'var(--gold-lit)' }}>
                          {b.batch_number}
                        </code>
                        {b.is_recalled ? (
                          <span style={{ fontSize:'0.6rem', color:'var(--red-lit)', fontFamily:'Cinzel,serif' }}>☠ RECALLED</span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div style={{ color:'var(--parchment)', fontWeight:500, fontSize:'0.82rem' }}>{b.product_name}</div>
                      <div style={{ fontSize:'0.7rem', color:'var(--text-dim)' }}>{b.brand}</div>
                    </td>
                    <td style={{ fontFamily:'Cinzel,serif', color:'var(--gold-lit)' }}>{formatQty(b.quantity)}</td>
                    <td style={{ fontSize:'0.78rem' }}>{formatDate(b.manufacturing_date)}</td>
                    <td style={{ fontSize:'0.78rem' }}>
                      {b.expiry_date === 0 ? <span style={{ color:'var(--text-dim)' }}>—</span> : (
                        <span style={{ color: exp?.isExpired ? '#e86060' : exp?.isNearExpiry ? '#e8c078' : 'var(--text)' }}>
                          {formatDate(b.expiry_date)}
                          {exp?.isNearExpiry && !exp.isExpired && <span style={{ marginLeft:'0.3rem', fontSize:'0.65rem' }}>({exp.days}d)</span>}
                          {exp?.isExpired && <span style={{ marginLeft:'0.3rem', fontSize:'0.65rem' }}>⚠ EXPIRED</span>}
                        </span>
                      )}
                    </td>
                    <td><span className="tx-hash" title={b.current_owner}>{shortAddr(b.current_owner)}</span></td>
                    <td><span className={statusClass(b.status)}>{statusLabel(b.status)}</span></td>
                    <td>
                      <Link to={`/batches/${b.id}`} className="btn btn-ghost btn-sm">View →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
