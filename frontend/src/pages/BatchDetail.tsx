import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBatch, createTransfer, updateBatchStatus, recallBatch } from '../services/api';
import { Batch, Transfer } from '../types';
import { formatDate, shortAddr, statusClass, statusLabel, explorerUrl, daysUntilExpiry, validNextStatuses } from '../utils/helpers';
import { useWallet } from '../contexts/WalletContext';
import { QRCodeSVG } from 'qrcode.react';

export default function BatchDetail() {
  const { id } = useParams();
  const { address, chainId } = useWallet();
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showRecall, setShowRecall]     = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [actionError, setActionError]   = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [transferForm, setTransferForm] = useState({ to: '', shipment_ref: '', status_after: 'IN_TRANSIT' });
  const [recallReason, setRecallReason] = useState('');
  const [newStatus, setNewStatus] = useState('');

  function load() {
    setLoading(true);
    getBatch(id!)
      .then(r => setBatch(r.data.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { if (id) load(); }, [id]);

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return setActionError('Connect wallet first');
    if (!transferForm.to) return setActionError('Recipient address is required');
    setSubmitting(true); setActionError(null);
    try {
      await createTransfer({
        item_id: id, item_type: 'batch',
        from_address: address, to_address: transferForm.to,
        shipment_ref: transferForm.shipment_ref,
        status_after: transferForm.status_after,
      });
      setActionSuccess('Transfer recorded successfully');
      setShowTransfer(false);
      load();
    } catch (e: any) { setActionError(e.message); }
    finally { setSubmitting(false); }
  }

  async function handleStatusUpdate() {
    if (!newStatus || !address) return;
    setSubmitting(true); setActionError(null);
    try {
      await updateBatchStatus(id!, { status: newStatus, actor_address: address });
      setActionSuccess(`Status updated to ${newStatus}`);
      setNewStatus('');
      load();
    } catch (e: any) { setActionError(e.message); }
    finally { setSubmitting(false); }
  }

  async function handleRecall(e: React.FormEvent) {
    e.preventDefault();
    if (!recallReason || !address) return setActionError('Reason required');
    setSubmitting(true); setActionError(null);
    try {
      await recallBatch(id!, { reason: recallReason, actor_address: address });
      setActionSuccess('Batch recalled. All units now flagged.');
      setShowRecall(false);
      load();
    } catch (e: any) { setActionError(e.message); }
    finally { setSubmitting(false); }
  }

  if (loading) return <div className="page"><div className="shimmer" style={{ height:300 }} /></div>;
  if (error || !batch) return <div className="page"><div className="alert alert-danger">⚠ {error || 'Not found'}</div></div>;

  const verifyUrl = `http://localhost:3001/api/verify/${id}`;
  const exp = batch.expiry_date ? daysUntilExpiry(batch.expiry_date) : null;
  const nextStatuses = validNextStatuses[batch.status as keyof typeof validNextStatuses] || [];

  return (
    <div className="page animate-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <Link to="/batches" style={{ fontSize:'0.75rem', color:'var(--text-dim)', textDecoration:'none' }}>← Back to Manifest</Link>
          <h1 className="page-title" style={{ marginTop:'0.25rem' }}>Batch: {batch.batch_number}</h1>
          <p className="page-subtitle">{batch.product_name} — {batch.brand}</p>
        </div>
        <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
          {!batch.is_recalled && address && (
            <>
              <button className="btn btn-gold btn-sm" onClick={() => setShowTransfer(true)}>⚓ Transfer</button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowRecall(true)}>☠ Recall</button>
            </>
          )}
        </div>
      </div>

      {/* Recall banner */}
      {batch.is_recalled && (
        <div className="alert alert-danger" style={{ marginBottom:'1rem' }}>
          <span style={{ fontSize:'1.25rem' }}>☠️</span>
          <div>
            <strong style={{ fontFamily:'Cinzel,serif', fontSize:'0.9rem' }}>BATCH RECALLED</strong>
            <div style={{ marginTop:'0.25rem', fontSize:'0.8rem' }}>{batch.recall_reason}</div>
            <div style={{ marginTop:'0.25rem', fontSize:'0.72rem', opacity:0.7 }}>
              All {batch.units?.length || 0} units in this batch are now flagged as recalled.
            </div>
          </div>
        </div>
      )}

      {/* Expiry warning */}
      {exp && (exp.isExpired || exp.isNearExpiry) && !batch.is_recalled && (
        <div className={`alert ${exp.isExpired ? 'alert-danger' : 'alert-warning'}`} style={{ marginBottom:'1rem' }}>
          <span style={{ fontSize:'1.25rem' }}>{exp.isExpired ? '⏰' : '⏳'}</span>
          <div>
            {exp.isExpired
              ? <><strong style={{ fontFamily:'Cinzel,serif' }}>EXPIRED</strong> — This batch expired on {formatDate(batch.expiry_date)}.</>
              : <><strong style={{ fontFamily:'Cinzel,serif' }}>EXPIRY WARNING</strong> — Expires in {exp.days} days ({formatDate(batch.expiry_date)}).</>
            }
          </div>
        </div>
      )}

      {actionSuccess && <div className="alert alert-success" style={{ marginBottom:'1rem' }}>✅ {actionSuccess}</div>}
      {actionError   && <div className="alert alert-danger" style={{ marginBottom:'1rem' }}>⚠ {actionError}</div>}

      {/* Main grid */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'1rem' }}>
        {/* Left: details + history */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {/* Batch info */}
          <div className="card">
            <div className="card-title">📋 Batch Details</div>
            <div className="gold-divider" />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem' }}>
              {[
                { label:'Batch Number',   value: <code style={{ fontFamily:'JetBrains Mono,monospace', color:'var(--gold-lit)' }}>{batch.batch_number}</code> },
                { label:'Product',        value: batch.product_name },
                { label:'Brand',          value: batch.brand },
                { label:'SKU Code',       value: <code style={{ fontFamily:'JetBrains Mono,monospace', color:'var(--text-dim)' }}>{batch.sku_code}</code> },
                { label:'Quantity',       value: batch.quantity?.toLocaleString() },
                { label:'Packaging',      value: batch.packaging_type || '—' },
                { label:'Mfg Date',       value: formatDate(batch.manufacturing_date) },
                { label:'Expiry Date',    value: batch.expiry_date ? formatDate(batch.expiry_date) : 'N/A' },
                { label:'Current Status', value: <span className={statusClass(batch.status)}>{statusLabel(batch.status)}</span> },
                { label:'Current Owner',  value: <span className="tx-hash">{shortAddr(batch.current_owner)}</span> },
                { label:'Registered',     value: formatDate(batch.registered_at) },
                { label:'Units Tracked',  value: `${batch.units?.length || 0}` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="label">{label}</div>
                  <div style={{ fontSize:'0.85rem', color:'var(--parchment)' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Status update */}
            {!batch.is_recalled && address && nextStatuses.length > 0 && (
              <div style={{ marginTop:'1.5rem', borderTop:'1px solid var(--border)', paddingTop:'1rem' }}>
                <div className="label" style={{ marginBottom:'0.5rem' }}>Update Status</div>
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  <select className="select" style={{ flex:1 }} value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}>
                    <option value="">Select new status…</option>
                    {nextStatuses.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                  </select>
                  <button className="btn btn-primary" onClick={handleStatusUpdate}
                    disabled={!newStatus || submitting}>Update</button>
                </div>
              </div>
            )}
          </div>

          {/* Transfer history */}
          <div className="card">
            <div className="card-title">⚓ Ownership History</div>
            <div className="gold-divider" />
            {batch.transfers?.length === 0 ? (
              <div className="empty-state" style={{ padding:'1.5rem' }}>
                <div className="empty-state-title">No transfers recorded</div>
              </div>
            ) : (
              <div className="timeline">
                {batch.transfers?.map((t: Transfer) => (
                  <div className="timeline-item" key={t.id}>
                    <div className="timeline-dot dot-transfer" />
                    <div className="timeline-content">
                      <div className="timeline-event">
                        <span className="tx-hash">{shortAddr(t.from_address)}</span>
                        {' → '}
                        <span style={{ color:'var(--parchment)' }}>{shortAddr(t.to_address)}</span>
                        {t.shipment_ref && <span style={{ marginLeft:'0.5rem', fontSize:'0.72rem', color:'var(--text-dim)' }}>({t.shipment_ref})</span>}
                      </div>
                      <div className="timeline-meta">
                        {formatDate(t.timestamp, { time:true })}
                        {' · '}
                        <span className={statusClass(t.status_after)}>{statusLabel(t.status_after)}</span>
                        {t.tx_hash && <> · <a href={explorerUrl(t.tx_hash, chainId)} target="_blank" rel="noreferrer"
                          className="tx-hash" style={{ marginLeft:'0.25rem' }}>
                          {t.tx_hash.slice(0,12)}…
                        </a></>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Units in this batch */}
          {batch.units?.length > 0 && (
            <div className="card">
              <div className="card-title">🏷️ Units in Batch ({batch.units.length})</div>
              <div className="gold-divider" />
              <div className="table-wrap">
                <table className="manifest-table">
                  <thead><tr><th>Serial</th><th>Status</th><th>Owner</th><th>Action</th></tr></thead>
                  <tbody>
                    {batch.units.slice(0,20).map((u: any) => (
                      <tr key={u.id}>
                        <td><code style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.78rem' }}>{u.unit_serial}</code></td>
                        <td><span className={statusClass(batch.is_recalled ? 'RECALLED' : u.status)}>{statusLabel(batch.is_recalled ? 'RECALLED' : u.status)}</span></td>
                        <td><span className="tx-hash">{shortAddr(u.current_owner)}</span></td>
                        <td><Link to={`/units/${u.id}`} className="btn btn-ghost btn-sm">View →</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: QR code */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div className="qr-panel">
            <div style={{ fontFamily:'Cinzel,serif', fontSize:'0.75rem', color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase' }}>
              Batch QR Code
            </div>
            <div className="qr-frame">
              <QRCodeSVG value={verifyUrl} size={180} level="H" bgColor="#ffffff" fgColor="#0a0f1e" />
            </div>
            <div style={{ fontSize:'0.7rem', color:'var(--text-dim)', textAlign:'center', lineHeight:1.5 }}>
              Scan to verify this batch on any device without a wallet
            </div>
            <Link to={`/verify/${id}`} className="btn btn-gold btn-sm">🔍 Open Verify Page</Link>
          </div>

          {/* Blockchain info */}
          {batch.tx_hash && (
            <div className="card">
              <div className="card-title">🔗 Blockchain Record</div>
              <div className="gold-divider" />
              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', fontSize:'0.78rem' }}>
                <div>
                  <div className="label">Transaction Hash</div>
                  <a href={explorerUrl(batch.tx_hash, chainId)} target="_blank" rel="noreferrer"
                    className="tx-hash" style={{ wordBreak:'break-all' }}>
                    {batch.tx_hash}
                  </a>
                </div>
                {batch.block_number && (
                  <div>
                    <div className="label">Block Number</div>
                    <span style={{ fontFamily:'JetBrains Mono,monospace', color:'var(--parchment)' }}>{batch.block_number}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transfer modal */}
      {showTransfer && (
        <div className="modal-overlay" onClick={() => setShowTransfer(false)}>
          <div className="modal animate-in" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">⚓ Transfer Batch Ownership</h3>
            <form onSubmit={handleTransfer} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div className="input-group">
                <label className="label">Recipient Wallet Address *</label>
                <input className="input" placeholder="0x..." value={transferForm.to}
                  onChange={e => setTransferForm(f => ({...f, to: e.target.value}))} />
              </div>
              <div className="input-group">
                <label className="label">Shipment Reference</label>
                <input className="input" placeholder="e.g. SHIP-2024-001" value={transferForm.shipment_ref}
                  onChange={e => setTransferForm(f => ({...f, shipment_ref: e.target.value}))} />
              </div>
              <div className="input-group">
                <label className="label">Status After Transfer</label>
                <select className="select" value={transferForm.status_after}
                  onChange={e => setTransferForm(f => ({...f, status_after: e.target.value}))}>
                  {['IN_TRANSIT','RECEIVED','IN_STOCK'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              {actionError && <div className="alert alert-danger">{actionError}</div>}
              <div className="alert alert-info">
                ℹ This records the transfer in the database. For on-chain transfer, use the smart contract directly with your wallet.
              </div>
              <div className="gold-divider" />
              <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowTransfer(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '⏳ Processing…' : '⚓ Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recall modal */}
      {showRecall && (
        <div className="modal-overlay" onClick={() => setShowRecall(false)}>
          <div className="modal animate-in" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title" style={{ color:'#e86060' }}>☠ Recall Batch</h3>
            <div className="alert alert-danger" style={{ marginBottom:'1rem' }}>
              This action will mark the entire batch and all its units as RECALLED. This cannot be undone.
            </div>
            <form onSubmit={handleRecall} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div className="input-group">
                <label className="label">Recall Reason *</label>
                <textarea className="input" rows={3} placeholder="State the reason for recall…"
                  value={recallReason} onChange={e => setRecallReason(e.target.value)} style={{ resize:'vertical' }} />
              </div>
              <div className="gold-divider" />
              <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowRecall(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={submitting}>
                  {submitting ? '⏳ Processing…' : '☠ Confirm Recall'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
