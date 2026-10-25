import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyProduct } from '../services/api';
import { formatDate, statusLabel } from '../utils/helpers';
import { QRCodeSVG } from 'qrcode.react';

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
          <h1 className="page-title">Sovereign Cargo Verifier</h1>
          <p className="page-subtitle">Public cryptographic provenance inspection terminal — zero wallet or gas required</p>
        </div>
      </div>

      {/* Search Input Box with Black Flag Golden Brackets */}
      <div className="card card-featured" style={{ maxWidth: 740, marginBottom: '2rem' }}>
        <div className="card-title">🔍 Scan QR Code or Input Lot / Serial Identifier</div>
        <div className="gold-divider" />
        <form onSubmit={handleVerify} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            className="input"
            style={{ flex: 1, minWidth: 260, fontSize: '0.9rem' }}
            placeholder="e.g. BATCH-2024-001 or SN-2024-0001..."
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
          />
          <button className="btn btn-gold" type="submit" disabled={loading || !searchId.trim()}>
            {loading ? 'Decrypting...' : '⚓ Interrogate Ledger'}
          </button>
        </form>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.85rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span>💡 Quick Test Identifiers:</span>
          <button
            type="button"
            onClick={() => { setSearchId('BATCH-2024-001'); }}
            style={{ background: 'none', border: 'none', color: 'var(--teal-bright)', cursor: 'pointer', textDecoration: 'underline' }}
          >
            BATCH-2024-001
          </button>
          <button
            type="button"
            onClick={() => { setSearchId('SN-2024-0001'); }}
            style={{ background: 'none', border: 'none', color: 'var(--teal-bright)', cursor: 'pointer', textDecoration: 'underline' }}
          >
            SN-2024-0001
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>⚠️ {error}</div>}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card shimmer" style={{ height: 260 }} />
        </div>
      )}

      {result && d && (
        <div className="animate-in">
          {/* Recall notification if recalled */}
          {isRecalled && (
            <div className="alert alert-danger" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--error)' }}>
              <span style={{ fontSize: '2rem' }}>🚨</span>
              <div>
                <strong style={{ fontFamily: 'Cinzel,serif', fontSize: '1.1rem', letterSpacing: '0.06em' }}>
                  QUARANTINED / RECALLED ITEM
                </strong>
                <div style={{ marginTop: '0.25rem', color: 'var(--text-main)' }}>{d.recall_reason || 'This production lot has been recalled by the manufacturer.'}</div>
                <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Do not distribute or consume this product. Return to certified dispensary or retailer.
                </div>
              </div>
            </div>
          )}

          {isExpired && !isRecalled && (
            <div className="alert alert-warning" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--warning)' }}>
              <span style={{ fontSize: '1.75rem' }}>⏳</span>
              <div>
                <strong style={{ fontFamily: 'Cinzel,serif', fontSize: '1rem' }}>PAST BEST-BEFORE EXPIRY</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  This item expired on {formatDate(d.expiry_date)}.
                </div>
              </div>
            </div>
          )}

          {/* Dossier Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            <div className="card card-featured">
              <div className="card-title">
                📜 Verified Provenance Record ({result.type.toUpperCase()})
              </div>
              <div className="gold-divider" />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <div className="label">Item Name</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gold-lit)' }}>{d.product_name}</div>
                </div>
                <div>
                  <div className="label">Brand &amp; Category</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>{d.brand} • {d.category}</div>
                </div>
                <div>
                  <div className="label">Product SKU</div>
                  <code style={{ fontFamily: 'JetBrains Mono,monospace', color: 'var(--teal-bright)', fontSize: '0.85rem' }}>
                    {d.sku_code}
                  </code>
                </div>
                <div>
                  <div className="label">Batch Lot</div>
                  <code style={{ fontFamily: 'JetBrains Mono,monospace', color: 'var(--gold-lit)', fontSize: '0.85rem' }}>
                    {d.batch_number}
                  </code>
                </div>
                {result.type === 'unit' && (
                  <div>
                    <div className="label">Unique Serial</div>
                    <code style={{ fontFamily: 'JetBrains Mono,monospace', color: 'var(--teal-bright)', fontSize: '0.85rem' }}>
                      {d.unit_serial}
                    </code>
                  </div>
                )}
                <div>
                  <div className="label">Manufacturer Enterprise</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{d.manufacturer_name || 'Apex Beverages Ltd'}</div>
                </div>
                <div>
                  <div className="label">Production Date</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{formatDate(d.manufacturing_date)}</div>
                </div>
                <div>
                  <div className="label">Expiry Horizon</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{d.expiry_date ? formatDate(d.expiry_date) : 'N/A'}</div>
                </div>
              </div>

              {/* Status pill */}
              <div style={{
                padding: '0.75rem 1rem',
                background: 'rgba(5, 20, 23, 0.8)',
                border: '1px solid var(--glass-border)',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: '0.75rem', fontFamily: 'Cinzel, serif', color: 'var(--gold-dim)', textTransform: 'uppercase' }}>
                  Cryptographic Status
                </span>
                <span className={`badge ${isRecalled ? 'badge-recalled' : isExpired ? 'badge-expired' : 'badge-in_stock'}`}>
                  {statusLabel(d.effective_status || d.status)}
                </span>
              </div>
            </div>

            {/* QR Digital Certificate Frame */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div className="card-title" style={{ alignSelf: 'flex-start' }}>
                🏷️ Anti-Counterfeit Verification Passport
              </div>
              <div className="gold-divider" style={{ width: '100%' }} />

              <div style={{
                padding: '1.25rem',
                background: '#FFFFFF',
                borderRadius: '8px',
                border: '2px solid var(--gold)',
                boxShadow: '0 0 20px rgba(205, 187, 114, 0.4)',
                margin: '1rem 0',
              }}>
                <QRCodeSVG
                  value={window.location.href}
                  size={160}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.72rem',
                color: 'var(--teal-bright)',
                wordBreak: 'break-all',
                maxWidth: 280,
                marginBottom: '0.5rem',
              }}>
                SHA256: {d.sku_code}-{d.batch_number}
              </div>

              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 320 }}>
                This QR verifies that this item is linked to the registered manufacturer on the Ethereum Sepolia state machine.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
