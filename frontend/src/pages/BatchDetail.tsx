import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBatch, createTransfer, updateBatchStatus, recallBatch } from '../services/api';
import { Batch } from '../types';
import { formatDate, shortAddr, statusLabel, daysUntilExpiry, validNextStatuses } from '../utils/helpers';
import { useWallet } from '../contexts/WalletContext';
import { QRCodeSVG } from 'qrcode.react';

export default function BatchDetail() {
  const { id } = useParams();
  const { address } = useWallet();
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mode switch: Batch Level vs Individual Unit Level
  const [trackingMode, setTrackingMode] = useState<'BATCH' | 'UNIT'>('BATCH');
  const [activeSection, setActiveSection] = useState<'OVERVIEW' | 'JOURNEY' | 'UNITS' | 'AUDIT'>('OVERVIEW');

  // Modals & Action States
  const [showTransfer, setShowTransfer] = useState(false);
  const [showRecall, setShowRecall] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
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

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return setActionError('Connect your wallet first');
    if (!transferForm.to) return setActionError('Recipient address is required');
    setSubmitting(true); setActionError(null);
    try {
      await createTransfer({
        item_id: id,
        item_type: 'batch',
        from_address: address,
        to_address: transferForm.to,
        shipment_ref: transferForm.shipment_ref,
        status_after: transferForm.status_after,
      });
      setActionSuccess('Custody transfer confirmed on blockchain');
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
      setActionSuccess(`Batch status updated to ${newStatus}`);
      setNewStatus('');
      load();
    } catch (e: any) { setActionError(e.message); }
    finally { setSubmitting(false); }
  }

  async function handleRecall(e: React.FormEvent) {
    e.preventDefault();
    if (!recallReason || !address) return setActionError('Reason required for emergency recall');
    setSubmitting(true); setActionError(null);
    try {
      await recallBatch(id!, { reason: recallReason, actor_address: address });
      setActionSuccess('Batch permanently recalled. All units flagged.');
      setShowRecall(false);
      load();
    } catch (e: any) { setActionError(e.message); }
    finally { setSubmitting(false); }
  }

  if (loading) return (
    <div className="page animate-in">
      <div className="shimmer" style={{ height: 350 }} />
    </div>
  );

  if (error || !batch) return (
    <div className="page">
      <div className="alert alert-danger">⚠ Failed to load consignment: {error || 'Not found'}</div>
    </div>
  );

  const verifyUrl = `http://localhost:3001/api/verify/${id}`;
  const exp = batch.expiry_date ? daysUntilExpiry(batch.expiry_date) : null;
  const nextStatuses = validNextStatuses[batch.status as keyof typeof validNextStatuses] || [];

  return (
    <div className="page animate-in">
      {/* ── TOP HEADER WITH TRACKING MODE SWITCHER ── */}
      <div className="page-header" style={{ alignItems: 'center' }}>
        <div>
          <Link to="/products" style={{ fontSize: '0.75rem', color: 'var(--teal)', textDecoration: 'none' }}>
            ← Return to Cargo Registry
          </Link>
          <h1 className="page-title" style={{ marginTop: '0.2rem' }}>
            Batch: {batch.batch_number}
          </h1>
          <p className="page-subtitle">
            {batch.product_name} · {batch.brand} · SKU: {batch.sku_code}
          </p>
        </div>

        {/* Tracking Mode Switcher: Batch vs Serialized Unit */}
        <div style={{
          display: 'flex',
          background: 'rgba(7, 23, 25, 0.9)',
          padding: '0.25rem',
          borderRadius: '6px',
          border: '1px solid var(--divider)'
        }}>
          <button
            onClick={() => setTrackingMode('BATCH')}
            className={`btn btn-sm ${trackingMode === 'BATCH' ? 'btn-gold' : 'btn-ghost'}`}
            style={{ borderRadius: 4 }}
          >
            📦 Production Lot Mode
          </button>
          <button
            onClick={() => setTrackingMode('UNIT')}
            className={`btn btn-sm ${trackingMode === 'UNIT' ? 'btn-gold' : 'btn-ghost'}`}
            style={{ borderRadius: 4 }}
          >
            🏷️ Serialized Unit Mode ({batch.units?.length || 0})
          </button>
        </div>
      </div>

      {/* Action Messages */}
      {actionSuccess && <div className="alert alert-info" style={{ marginBottom: '1rem' }}>✓ {actionSuccess}</div>}
      {actionError && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>⚠ {actionError}</div>}

      {/* ── THREE-COLUMN PROGRESS TRACKER LAYOUT (Screen B Reference) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 320px', gap: '1.25rem' }}>
        {/* Left Section Navigation (Upgrade/Tracker Menu Style) */}
        <div className="card" style={{ padding: '0.75rem' }}>
          <div style={{
            fontSize: '0.65rem',
            fontFamily: 'Cinzel, serif',
            color: 'var(--gold)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '0.4rem 0.6rem'
          }}>
            Module Breakdown
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.4rem' }}>
            {[
              { key: 'OVERVIEW', label: 'Consignment Overview', icon: '📋' },
              { key: 'JOURNEY', label: 'Lifecycle Journey', icon: '⚓' },
              { key: 'UNITS', label: 'Unit Hierarchy', icon: '🏷️' },
              { key: 'AUDIT', label: 'Blockchain Audit', icon: '🔗' },
            ].map(sec => (
              <button
                key={sec.key}
                onClick={() => setActiveSection(sec.key as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 4,
                  fontSize: '0.78rem',
                  background: activeSection === sec.key ? 'rgba(205, 187, 114, 0.18)' : 'transparent',
                  border: activeSection === sec.key ? '1px solid var(--gold-border)' : '1px solid transparent',
                  color: activeSection === sec.key ? 'var(--gold-lit)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{sec.icon}</span>
                <span style={{ fontWeight: activeSection === sec.key ? 600 : 400 }}>{sec.label}</span>
              </button>
            ))}
          </div>

          <div className="gold-divider" style={{ margin: '1rem 0' }} />

          {/* Quick Status Pill */}
          <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.72rem' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.3rem' }}>LIFECYCLE STATUS</div>
            <span className={`badge badge-${batch.status.toLowerCase()}`}>
              {statusLabel(batch.status)}
            </span>
          </div>
        </div>

        {/* Center Workspace: Dynamic Details */}
        <div className="card card-elevated">
          {activeSection === 'OVERVIEW' && (
            <div>
              <div className="card-title">
                <span>📦</span> CONSIGNMENT SPECIFICATIONS
              </div>
              <div className="gold-divider" />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(7, 23, 25, 0.7)', padding: '0.85rem', borderRadius: 4, border: '1px solid var(--divider)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>CURRENT CUSTODIAN</div>
                  <div style={{ fontSize: '0.82rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--gold-lit)', marginTop: '0.2rem' }}>
                    {shortAddr(batch.current_owner)}
                  </div>
                </div>

                <div style={{ background: 'rgba(7, 23, 25, 0.7)', padding: '0.85rem', borderRadius: 4, border: '1px solid var(--divider)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>PRODUCTION QUANTITY</div>
                  <div style={{ fontSize: '1.1rem', fontFamily: 'Cinzel, serif', color: 'var(--teal)', fontWeight: 700, marginTop: '0.1rem' }}>
                    {batch.quantity?.toLocaleString()} units
                  </div>
                </div>

                <div style={{ background: 'rgba(7, 23, 25, 0.7)', padding: '0.85rem', borderRadius: 4, border: '1px solid var(--divider)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>MANUFACTURE DATE</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {formatDate(batch.manufacturing_date)}
                  </div>
                </div>

                <div style={{ background: 'rgba(7, 23, 25, 0.7)', padding: '0.85rem', borderRadius: 4, border: '1px solid var(--divider)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>EXPIRATION HORIZON</div>
                  <div style={{ fontSize: '0.82rem', color: exp?.isExpired ? 'var(--error)' : 'var(--text-main)', marginTop: '0.2rem' }}>
                    {formatDate(batch.expiry_date)} ({exp?.isExpired ? 'EXPIRED' : `${exp?.days} days remaining`})
                  </div>
                </div>
              </div>

              {/* Progress Milestones Bar */}
              <div style={{ background: 'rgba(7, 23, 25, 0.6)', padding: '1rem', borderRadius: 6, border: '1px solid var(--divider)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--gold-lit)', fontFamily: 'Cinzel, serif', marginBottom: '0.75rem' }}>
                  SUPPLY CHAIN MILESTONE PROGRESSION
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                  {['REGISTERED', 'IN_TRANSIT', 'RECEIVED', 'IN_STOCK', 'SOLD'].map((st, i) => {
                    const isReached = ['REGISTERED', 'IN_TRANSIT', 'RECEIVED', 'IN_STOCK', 'SOLD'].indexOf(batch.status) >= i;
                    return (
                      <div key={st} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%',
                          background: isReached ? 'var(--teal)' : 'var(--bg-primary)',
                          border: `2px solid ${isReached ? 'var(--teal)' : 'var(--divider)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.6rem', color: '#071719', fontWeight: 800
                        }}>
                          {isReached ? '✓' : i + 1}
                        </div>
                        <span style={{ fontSize: '0.62rem', marginTop: '0.35rem', color: isReached ? 'var(--text-main)' : 'var(--text-muted)' }}>
                          {st.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'JOURNEY' && (
            <div>
              <div className="card-title"><span>⚓</span> LOGISTICS HOPS &amp; CUSTODY TRANSFERS</div>
              <div className="gold-divider" />
              {(!batch.transfers || batch.transfers.length === 0) ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No transfers yet. Consignment docked at factory line.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {batch.transfers.map((t: any, i: number) => (
                    <div key={t.id} style={{
                      padding: '0.85rem',
                      background: 'rgba(7, 23, 25, 0.7)',
                      borderLeft: '3px solid var(--gold)',
                      borderRadius: '0 4px 4px 0',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>Hop #{i + 1}: {t.shipment_ref || 'Standard Waybill'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          From: {shortAddr(t.from_address)} ➔ To: {shortAddr(t.to_address)}
                        </div>
                      </div>
                      <span className="badge badge-in_stock">{t.status_after}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'UNITS' && (
            <div>
              <div className="card-title"><span>🏷️</span> SERIALIZED BOTTLES &amp; CARTONS</div>
              <div className="gold-divider" />
              {(!batch.units || batch.units.length === 0) ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No serialized units registered under this lot yet.
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="manifest-table">
                    <thead>
                      <tr><th>Serial ID</th><th>Custodian</th><th>Status</th><th>Registration</th></tr>
                    </thead>
                    <tbody>
                      {batch.units.map((u: any) => (
                        <tr key={u.id}>
                          <td><code style={{ color: 'var(--gold-lit)' }}>{u.unit_serial}</code></td>
                          <td>{shortAddr(u.current_owner)}</td>
                          <td><span className={`badge badge-${u.status.toLowerCase()}`}>{u.status}</span></td>
                          <td>{formatDate(u.registered_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeSection === 'AUDIT' && (
            <div>
              <div className="card-title"><span>🔗</span> ON-CHAIN CRYPTOGRAPHIC PROOF</div>
              <div className="gold-divider" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--divider)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Contract Binding</span>
                  <span style={{ color: 'var(--gold-lit)', fontFamily: 'JetBrains Mono, monospace' }}>FMCGSupplyChain.sol</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--divider)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>On-Chain ID</span>
                  <span style={{ color: 'var(--teal)', fontFamily: 'JetBrains Mono, monospace' }}>{batch.on_chain_id || '0x5FbD...aa3'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--divider)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>State Integrity Hash</span>
                  <span style={{ color: 'var(--text-main)', fontFamily: 'JetBrains Mono, monospace' }}>{batch.tx_hash || '0x8f26...4e49'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Action Panel: QR Terminal & Authorized Mutations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* QR Verification Frame */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--gold-lit)', fontFamily: 'Cinzel, serif', marginBottom: '0.75rem' }}>
              MARITIME QR PASSPORT
            </div>
            <div style={{ background: '#FFFFFF', padding: '0.65rem', borderRadius: '4px', boxShadow: '0 0 15px rgba(89, 197, 187, 0.25)' }}>
              <QRCodeSVG value={verifyUrl} size={150} level="H" />
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.6rem' }}>
              Public zero-wallet provenance checkpoint
            </div>
            <Link to={`/verify/${id}`} className="btn btn-gold btn-sm" style={{ marginTop: '0.75rem', width: '100%' }}>
              🔍 Open Public Verifier
            </Link>
          </div>

          {/* Authorized Actions */}
          <div className="card">
            <div className="card-title"><span>⚔️</span> ACTIONS</div>
            <div className="gold-divider" />
            {!batch.is_recalled ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <button className="btn btn-gold btn-sm" onClick={() => setShowTransfer(true)} style={{ width: '100%' }}>
                  ⚓ Transfer Custody
                </button>
                {nextStatuses.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                    <select
                      className="select"
                      style={{ fontSize: '0.72rem' }}
                      value={newStatus}
                      onChange={e => setNewStatus(e.target.value)}
                    >
                      <option value="">Transition Status…</option>
                      {nextStatuses.map((st: string) => <option key={st} value={st}>{st}</option>)}
                    </select>
                    <button className="btn btn-primary btn-sm" onClick={handleStatusUpdate} disabled={!newStatus || submitting}>
                      Set
                    </button>
                  </div>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => setShowRecall(true)} style={{ marginTop: '0.5rem', width: '100%' }}>
                  ☠ Emergency Recall
                </button>
              </div>
            ) : (
              <div className="alert alert-danger" style={{ fontSize: '0.72rem' }}>
                TERMINAL STATE: Batch is permanently recalled.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TRANSFER MODAL ── */}
      {showTransfer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card card-elevated" style={{ width: 440, maxWidth: '90%' }}>
            <div className="card-title"><span>⚓</span> EXECUTE CUSTODY TRANSFER</div>
            <div className="gold-divider" />
            <form onSubmit={handleTransfer}>
              <div className="input-group">
                <label className="label">Destination Recipient Address *</label>
                <input
                  className="input"
                  placeholder="0x..."
                  value={transferForm.to}
                  onChange={e => setTransferForm({ ...transferForm, to: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label className="label">Waybill / Shipment Reference</label>
                <input
                  className="input"
                  placeholder="e.g. WAYBILL-CARIB-09"
                  value={transferForm.shipment_ref}
                  onChange={e => setTransferForm({ ...transferForm, shipment_ref: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowTransfer(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-gold btn-sm" disabled={submitting}>
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RECALL MODAL ── */}
      {showRecall && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card card-elevated" style={{ width: 440, maxWidth: '90%' }}>
            <div className="card-title" style={{ color: 'var(--error)' }}><span>☠️</span> INITIATE EMERGENCY RECALL</div>
            <div className="gold-divider" />
            <form onSubmit={handleRecall}>
              <div className="input-group">
                <label className="label">Formal Reason for Recall *</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Explain defect (e.g. seal integrity breach)..."
                  value={recallReason}
                  onChange={e => setRecallReason(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowRecall(false)}>
                  Abort
                </button>
                <button type="submit" className="btn btn-danger btn-sm" disabled={submitting}>
                  Execute Recall Lock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
