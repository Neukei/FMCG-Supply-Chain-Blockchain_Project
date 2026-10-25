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
    sku_code: '', name: '', brand: '', category: 'Beverage',
    description: '', manufacturer_name: 'Apex Beverages Ltd',
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
      setForm({ sku_code:'', name:'', brand:'', category:'Beverage', description:'', manufacturer_name:'Apex Beverages Ltd' });
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
          <h1 className="page-title">Cargo SKU Registry</h1>
          <p className="page-subtitle">Master catalog of FMCG products authorized for blockchain provenance</p>
        </div>
        <button className="btn btn-gold" onClick={() => setShowForm(true)}>
          ➕ Register New SKU
        </button>
      </div>

      {/* Register Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal animate-in" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">⚓ Commission New Product SKU</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Create an immutable master record. Future production lots and retail bottles will reference this SKU.
            </p>
            {formError && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{formError}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="label">SKU Code *</label>
                  <input
                    className="input"
                    placeholder="e.g. SKU-BEV-001"
                    value={form.sku_code}
                    onChange={e => setForm(f => ({ ...f, sku_code: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div className="input-group">
                  <label className="label">Category *</label>
                  <select
                    className="select"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="label">Product Name *</label>
                  <input
                    className="input"
                    placeholder="e.g. Organic Sparkling Citrus"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="input-group">
                  <label className="label">Brand *</label>
                  <input
                    className="input"
                    placeholder="e.g. PureHarvest"
                    value={form.brand}
                    onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="label">Manufacturer Enterprise *</label>
                <input
                  className="input"
                  value={form.manufacturer_name}
                  onChange={e => setForm(f => ({ ...f, manufacturer_name: e.target.value }))}
                />
              </div>

              <div className="input-group">
                <label className="label">Product Description</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Ingredients, certifications, packaging specs..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="gold-divider" />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Registering on-chain...' : '⚓ Commit to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>{error}</div>}

      {/* Grid of registered product SKUs in Black Flag Smoked Glass Style */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card shimmer" style={{ height: 180 }} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-title">No Product SKUs Found</div>
            <div className="empty-state-sub">Commission your first product type to begin tracking batches and retail units.</div>
            <button className="btn btn-gold" style={{ marginTop: '1rem' }} onClick={() => setShowForm(true)}>
              ➕ Commission First SKU
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {products.map(p => (
            <div key={p.id} className="card card-featured">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                <div>
                  <span style={{
                    fontSize: '0.65rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    color: 'var(--teal-bright)',
                    border: '1px solid var(--teal-dim)',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '3px',
                    display: 'inline-block',
                    marginBottom: '0.4rem',
                  }}>
                    {p.sku_code}
                  </span>
                  <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--gold-lit)' }}>{p.name}</h3>
                </div>
                <span className="badge badge-registered">{p.category}</span>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.85rem', minHeight: 38 }}>
                {p.description || `Authentic ${p.category} managed under global FMCG traceability standard.`}
              </div>

              <div className="gold-divider" style={{ margin: '0.6rem 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                <div>
                  <span style={{ color: 'var(--gold-dim)' }}>MAKER:</span>{' '}
                  <span style={{ color: 'var(--text-main)' }}>{p.manufacturer_name}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--gold-dim)' }}>REGISTERED:</span>{' '}
                  <span style={{ color: 'var(--text-main)' }}>{formatDate(p.registered_at)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link to={`/batches?product_id=${p.id}`} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>
                  📋 View Batches
                </Link>
                <Link to={`/verify/${p.sku_code}`} className="btn btn-primary btn-sm">
                  🔍 Verify
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
