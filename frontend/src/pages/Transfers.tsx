import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTransfers, getBatches, createTransfer } from '../services/api';
import { Transfer, Batch } from '../types';
import { formatDate, shortAddr, statusClass, statusLabel, explorerUrl } from '../utils/helpers';
import { useWallet } from '../contexts/WalletContext';

export default function Transfers() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [batches, setBatches]     = useState<Batch[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<'all' | 'batch' | 'unit'>('all');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  const { chainId, address, activeActor } = useWallet();

  const [form, setForm] = useState({
    item_type: 'batch',
    item_id: '',
    to_address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // TransGlobal Freight default
    new_status: 'IN_TRANSIT',
    shipment_ref: 'WAYBILL-CARIB-2026',
    notes: 'Maritime corridor shipment handover',
  });

  function load() {
    setLoading(true);
    Promise.all([
      getTransfers(filter !== 'all' ? { item_type: filter } : undefined),
      getBatches(),
    ])
      .then(([t, b]) => {
        setTransfers(t.data.data);
        setBatches(b.data.data);
        if (b.data.data.length > 0 && !form.item_id) {
          setForm(f => ({ ...f, item_id: b.data.data[0].id }));
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [filter]);

  async function handleTransferSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTransferError(null);
    if (!form.item_id || !form.to_address) return setTransferError('Fill all required fields.');
    if (!address) return setTransferError('Wallet not connected.');
    setSubmitting(true);
    try {
      await createTransfer({
        ...form,
        from_address: address,
      });
      setShowTransferModal(false);
      load();
    } catch (err: any) {
      setTransferError(err.message || 'Transfer failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Waybills &amp; Custody Transfers</h1>
          <p className="page-subtitle">Cryptographic chain-of-custody handovers recorded across maritime trade channels</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-gold" onClick={() => setShowTransferModal(true)}>
            📜 Dispatch New Waybill
          </button>
          <div style={{ display:'flex', gap:'0.35rem', background: 'rgba(5, 20, 23, 0.7)', padding: '0.2rem', borderRadius: '4px', border: '1px solid var(--divider)' }}>
            {(['all','batch','unit'] as const).map(f => (
              <button key={f} className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f === 'batch' ? '📦 Batches' : '🏷️ Units'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal for dispatching a transfer */}
      {showTransferModal && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal animate-in" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">📜 Dispatch Custody Waybill</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Transfer legal cargo stewardship to the next verified supply chain participant.
            </p>
            {transferError && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{transferError}</div>}
            <form onSubmit={handleTransferSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label className="label">Transfer Type</label>
                <select
                  className="select"
                  value={form.item_type}
                  onChange={e => setForm(f => ({ ...f, item_type: e.target.value }))}
                >
                  <option value="batch">Production Batch Lot</option>
                  <option value="unit">Individual Serialized Unit</option>
                </select>
              </div>

              <div className="input-group">
                <label className="label">Target Batch Lot *</label>
                <select
                  className="select"
                  value={form.item_id}
                  onChange={e => setForm(f => ({ ...f, item_id: e.target.value }))}
                >
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.batch_number} — {b.product_name} ({b.status})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="label">Recipient Wallet Address *</label>
                  <input
                    className="input"
                    placeholder="0x..."
                    value={form.to_address}
                    onChange={e => setForm(f => ({ ...f, to_address: e.target.value }))}
                  />
                </div>
                <div className="input-group">
                  <label className="label">Transition Status *</label>
                  <select
                    className="select"
                    value={form.new_status}
                    onChange={e => setForm(f => ({ ...f, new_status: e.target.value }))}
                  >
                    <option value="IN_TRANSIT">IN_TRANSIT (Departed Facility)</option>
                    <option value="RECEIVED">RECEIVED (Dock Handover)</option>
                    <option value="IN_STOCK">IN_STOCK (Warehouse Catalog)</option>
                    <option value="SOLD">SOLD (Retail Customer Handover)</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="label">Maritime Waybill Ref / Bill of Lading</label>
                <input
                  className="input"
                  value={form.shipment_ref}
                  onChange={e => setForm(f => ({ ...f, shipment_ref: e.target.value }))}
                />
              </div>

              <div className="gold-divider" />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowTransferModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Executing handover...' : '⚓ Sign & Record Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
          {[...Array(6)].map((_,i) => <div key={i} className="shimmer" style={{ height:52 }} />)}
        </div>
      ) : transfers.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📜</div>
            <div className="empty-state-title">No Transfers Recorded Yet</div>
            <div className="empty-state-sub">Custody transfers between manufacturers, distributors, and warehouses will appear here.</div>
            <button className="btn btn-gold" style={{ marginTop: '1rem' }} onClick={() => setShowTransferModal(true)}>
              📜 Dispatch First Waybill
            </button>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="manifest-table">
            <thead>
              <tr>
                <th>Consignment Item</th>
                <th>Classification</th>
                <th>Origin Custodian</th>
                <th>Destination Custodian</th>
                <th>Waybill Reference</th>
                <th>Updated Status</th>
                <th>Logged Timestamp</th>
                <th style={{ textAlign: 'right' }}>EVM Hash</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map(t => (
                <tr key={t.id}>
                  <td>
                    <Link to={`/${t.item_type === 'batch' ? 'batches' : 'units'}/${t.item_id}`}
                      style={{ color:'var(--teal-bright)', textDecoration:'none', fontFamily:'JetBrains Mono,monospace', fontSize:'0.78rem' }}>
                      {t.item_id.slice(0, 12)}…
                    </Link>
                  </td>
                  <td>
                    <span style={{ fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.08em',
                      color: t.item_type === 'batch' ? 'var(--gold-lit)' : 'var(--teal-bright)' }}>
                      {t.item_type === 'batch' ? '📦 Batch Lot' : '🏷️ Unit Item'}
                    </span>
                  </td>
                  <td><span className="tx-hash" title={t.from_address}>{shortAddr(t.from_address)}</span></td>
                  <td><span style={{ color:'var(--text-main)', fontFamily:'JetBrains Mono,monospace', fontSize:'0.78rem' }} title={t.to_address}>{shortAddr(t.to_address)}</span></td>
                  <td style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{t.shipment_ref || '—'}</td>
                  <td><span className={statusClass(t.status_after)}>{statusLabel(t.status_after)}</span></td>
                  <td style={{ fontSize:'0.78rem', color: 'var(--text-muted)' }}>{formatDate(t.timestamp, { time:true })}</td>
                  <td style={{ textAlign: 'right' }}>
                    {t.tx_hash ? (
                      <a href={explorerUrl(t.tx_hash, chainId)} target="_blank" rel="noreferrer" className="tx-hash">
                        {t.tx_hash.slice(0,10)}… ↗
                      </a>
                    ) : <span style={{ color:'var(--text-dim)', fontSize:'0.72rem' }}>State-Signed</span>}
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
