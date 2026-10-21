import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyProduct } from '../services/api';
import { formatDate, statusLabel } from '../utils/helpers';

export default function Verify() {
  const { id: paramId } = useParams();
  const nav = useNavigate();
  const [searchId, setSearchId] = useState(paramId || '');
  const [result, setResult]   = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleVerify(e?: React.FormEvent) {
    e?.preventDefault();
    if (!searchId.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await verifyProduct(searchId.trim());
      setResult(r.data);
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  React.useEffect(() => { if (paramId) handleVerify(); }, []);

  const d = result?.data;
  const isRecalled = d?.is_recalled || d?.status === 'RECALLED' || d?.effective_status === 'RECALLED';
  const isExpired  = d?.expiry_date && d.expiry_date < Math.floor(Date.now() / 1000);

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cargo Verification</h1>
          <p className="page-subtitle">Public product verification — no wallet required</p>
        </div>
      </div>

      {/* Search form */}
      <div className="card" style={{ maxWidth:600, marginBottom:'1.5rem' }}>
        <div className="card-title">🔍 Verify by ID or QR Code</div>
        <div className="gold-divider" />
        <form onSubmit={handleVerify} style={{ display:'flex', gap:'0.75rem' }}>
          <input className="input" style={{ flex:1 }} placeholder="Enter batch or unit ID…"
            value={searchId} onChange={e => setSearchId(e.target.value)} />
          <button className="btn btn-primary" type="submit" disabled={loading || !searchId.trim()}>
            {loading ? '⏳' : '🔍 Verify'}
          </button>
        </form>
        <p style={{ fontSize:'0.72rem', color:'var(--text-dim)', marginTop:'0.75rem' }}>
          Scan a QR code from product packaging, or paste the batch/unit ID from the manifest.
          You do not need a blockchain wallet to verify a product.
        </p>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom:'1rem' }}>⚠ {error}</div>}

      {loading && (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          <div className="shimmer" style={{ height:200 }} />
        </div>
      )}

      {result && d && (
        <div className="animate-in">
          {/* Recall alert */}
          {isRecalled && (
            <div className="alert alert-danger" style={{ marginBottom:'1rem' }}>
              <span style={{ fontSize:'1.5rem' }}>☠️</span>
              <div>
                <strong style={{ fontFamily:'Cinzel,serif', fontSize:'1rem' }}>RECALLED PRODUCT</strong>
                <div style={{ marginTop:'0.25rem' }}>{d.recall_reason || 'This batch has been recalled.'}</div>
                <div style={{ marginTop:'0.25rem', fontSize:'0.72rem', opacity:0.7 }}>
                  Do not consume this product. Contact the manufacturer or retailer.
                </div>
              </div>
            </div>
          )}

          {isExpired && !isRecalled && (
            <div className="alert alert-danger" style={{ marginBottom:'1rem' }}>
              <span style={{ fontSize:'1.5rem' }}>⏰</span>
              <strong style={{ fontFamily:'Cinzel,serif' }}>EXPIRED</strong> — This product expired on {formatDate(d.expiry_date)}.
            </div>
          )}

          {/* Product info card */}
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'1rem' }}>
            <div className="card">
              <div className="card-title">
                ✅ Verified {result.type === 'batch' ? 'Batch' : 'Unit'} Record
              </div>
              <div className="gold-divider" />

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
                {[
                  { label:'Product', value: d.product_name },
                  { label:'Brand',   value: d.brand },
                  { label:'SKU Code', value: <code style={{ fontFamily:'JetBrains Mono,monospace', color:'var(--gold-lit)', fontSize:'0.8rem' }}>{d.sku_code}</code> },
                  { label:'Category', value: d.category },
                  { label:'Manufacturer', value: d.manufacturer_name || '—' },
                  result.type === 'batch'
                    ? { label:'Batch Number', value: <code style={{ fontFamily:'JetBrains Mono,monospace', color:'var(--gold-lit)' }}>{d.batch_number}</code> }
                    : { label:'Unit Serial', value: <code style={{ fontFamily:'JetBrains Mono,monospace', color:'var(--gold-lit)' }}>{d.unit_serial}</code> },
                  { label:'Mfg Date', value: formatDate(d.manufacturing_date) },
                  { label:'Expiry Date', value: d.expiry_date ? formatDate(d.expiry_date) : 'N/A' },
                  { label:'Status', value: <span style={{
                    fontFamily:'Cinzel,serif',
                    fontSize:'0.8rem',
                    color: isRecalled ? '#e86060' : isExpired ? '#e86060' : '#70c890',
                  }}>{statusLabel(d.effective_status || d.status)}</span> },
                  { label:'Quantity', value: d.quantity ? d.quantity.toLocaleString() + ' units' : '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="label">{label}</div>
                    <div style={{ fontSize:'0.85rem', color:'var(--parchment)' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Transfer history */}
              {d.transfers?.length > 0 && (
                <>
                  <div className="ornament-divider">Supply Chain History</div>
                  <div className="timeline">
                    {d.transfers.map((t: any, i: number) => (
                      <div className="timeline-item" key={t.id || i}>
                        <div className="timeline-dot dot-transfer" />
                        <div className="timeline-content">
                          <div className="timeline-event">
                            {t.from_address?.slice(0,8)}… → {t.to_address?.slice(0,8)}…
                            {t.shipment_ref && <span style={{ color:'var(--text-dim)', marginLeft:'0.4rem' }}>({t.shipment_ref})</span>}
                          </div>
                          <div className="timeline-meta">{formatDate(t.timestamp, { time:true })}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* QR & limitation */}
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              {d.qr_code && (
                <div className="qr-panel">
                  <div style={{ fontFamily:'Cinzel,serif', fontSize:'0.72rem', color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase' }}>
                    Verification QR
                  </div>
                  <div className="qr-frame">
                    <img src={d.qr_code} alt="QR Code" width={160} height={160} />
                  </div>
                  <div style={{ fontSize:'0.68rem', color:'var(--text-dim)', textAlign:'center' }}>
                    Share this QR to allow others to verify
                  </div>
                </div>
              )}

              <div className="card" style={{ borderColor:'rgba(201,165,78,0.2)' }}>
                <div className="card-title">⚠ Verification Limitation</div>
                <div className="gold-divider" />
                <p style={{ fontSize:'0.75rem', color:'var(--text-dim)', lineHeight:1.6 }}>
                  {result.limitation_notice}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !result && !error && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">Enter a Product ID to Verify</div>
            <div className="empty-state-sub">Paste the batch or unit ID from a product's QR code or manifest.</div>
          </div>
        </div>
      )}
    </div>
  );
}
