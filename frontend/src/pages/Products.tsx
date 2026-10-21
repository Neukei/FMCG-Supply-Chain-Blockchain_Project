import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProducts, createProduct } from '../services/api';
import { ProductType } from '../types';
import { formatDate, shortAddr } from '../utils/helpers';
import { useWallet } from '../contexts/WalletContext';

export default function Products() {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { address } = useWallet();
  const nav = useNavigate();

  const [form, setForm] = useState({
    sku_code: '', name: '', brand: '', category: '',
    description: '', manufacturer_name: '',
  });

  function load() {
    setLoading(true);
    getProducts()
      .then(r => setProducts(r.data.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.sku_code || !form.name || !form.brand || !form.category) {
      setFormError('Please fill in all required fields.');
      return;
    }
    if (!address) { setFormError('Connect your wallet first.'); return; }
    setSubmitting(true);
    try {
      await createProduct({
        ...form,
        manufacturer_address: address,
        registered_at: Math.floor(Date.now() / 1000),
      });
      setShowForm(false);
      setForm({ sku_code:'', name:'', brand:'', category:'', description:'', manufacturer_name:'' });
      load();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const CATEGORIES = ['Beverage','Snack','Dairy','Bakery','Confectionery','Frozen Food','Personal Care','Household','Other'];

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Product Registry</h1>
          <p className="page-subtitle">Registered product types &amp; SKUs in the manifest</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>⊕ Register Product</button>
      </div>

      {/* Registration modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal animate-in" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">⊕ Register New Product Type</h3>
            <p style={{ fontSize:'0.78rem', color:'var(--text-dim)', marginBottom:'1.25rem' }}>
              A product type defines the SKU. Individual batches and units will reference this record.
            </p>
            {formError && <div className="alert alert-danger" style={{ marginBottom:'1rem' }}>{formError}</div>}
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div className="input-group">
                  <label className="label">SKU Code *</label>
                  <input className="input" placeholder="e.g. CC-500ML-001" value={form.sku_code}
                    onChange={e => setForm(f => ({...f, sku_code: e.target.value}))} />
                </div>
                <div className="input-group">
                  <label className="label">Product Name *</label>
                  <input className="input" placeholder="e.g. Coca-Cola 500ml" value={form.name}
                    onChange={e => setForm(f => ({...f, name: e.target.value}))} />
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div className="input-group">
                  <label className="label">Brand *</label>
                  <input className="input" placeholder="e.g. Coca-Cola" value={form.brand}
                    onChange={e => setForm(f => ({...f, brand: e.target.value}))} />
                </div>
                <div className="input-group">
                  <label className="label">Category *</label>
                  <select className="select" value={form.category}
                    onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                    <option value="">Select category…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label className="label">Manufacturer Name</label>
                <input className="input" placeholder="Company name" value={form.manufacturer_name}
                  onChange={e => setForm(f => ({...f, manufacturer_name: e.target.value}))} />
              </div>
              <div className="input-group">
                <label className="label">Description</label>
                <textarea className="input" rows={2} placeholder="Optional description…" value={form.description}
                  onChange={e => setForm(f => ({...f, description: e.target.value}))} style={{ resize:'vertical' }} />
              </div>
              {address && (
                <div style={{ fontSize:'0.72rem', color:'var(--text-dim)', fontFamily:'JetBrains Mono,monospace' }}>
                  Registering as: {address}
                </div>
              )}
              <div className="gold-divider" />
              <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '⏳ Registering…' : '⚓ Register Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products table */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
          {[...Array(5)].map((_,i) => <div key={i} className="shimmer" style={{ height:50 }} />)}
        </div>
      ) : error ? (
        <div className="alert alert-danger">⚠ {error}</div>
      ) : products.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No Products Registered</div>
            <div className="empty-state-sub">Register the first product type to begin the manifest.</div>
            <button className="btn btn-gold" style={{ marginTop:'0.5rem' }} onClick={() => setShowForm(true)}>
              ⊕ Register First Product
            </button>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="manifest-table">
            <thead>
              <tr>
                <th>SKU Code</th>
                <th>Product Name</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Manufacturer</th>
                <th>Batches</th>
                <th>Registered</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td><code style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.78rem', color:'var(--gold-lit)' }}>{p.sku_code}</code></td>
                  <td style={{ color:'var(--parchment)', fontWeight:500 }}>{p.name}</td>
                  <td>{p.brand}</td>
                  <td><span style={{ fontSize:'0.72rem', color:'var(--text-dim)' }}>{p.category}</span></td>
                  <td>
                    <span className="tx-hash" title={p.manufacturer_address}>
                      {p.manufacturer_name || shortAddr(p.manufacturer_address)}
                    </span>
                  </td>
                  <td style={{ textAlign:'center' }}>
                    <span style={{ fontFamily:'Cinzel,serif', color:'var(--gold-lit)' }}>{p.batch_count || 0}</span>
                  </td>
                  <td style={{ fontSize:'0.78rem' }}>{formatDate(p.registered_at)}</td>
                  <td>
                    <Link to={`/products/${p.id}`} className="btn btn-ghost btn-sm">View →</Link>
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
