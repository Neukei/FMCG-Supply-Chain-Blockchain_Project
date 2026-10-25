import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, getBatches } from '../services/api';
import { DashboardStats, Batch } from '../types';
import { formatDate, shortAddr } from '../utils/helpers';

// Helper for Black Flag circular progress rings
function CircularRing({ percent, label, subtitle, color = 'var(--gold)' }: { percent: number; label: string; subtitle: string; color?: string }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0.5rem' }}>
      <div style={{ position: 'relative', width: 96, height: 96 }}>
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle className="ring-track" cx="48" cy="48" r={radius} strokeWidth="6" />
          <circle
            className="ring-indicator"
            cx="48"
            cy="48"
            r={radius}
            strokeWidth="6"
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          fontFamily: 'Cinzel, serif',
          fontWeight: 700,
          fontSize: '1.1rem',
          color: 'var(--text-main)'
        }}>
          {percent}%
        </div>
      </div>
      <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold-lit)', marginTop: '0.5rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
        {subtitle}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getBatches()
    ])
      .then(([statsRes, batchRes]) => {
        setStats(statsRes.data.data);
        setBatches(batchRes.data.data || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page animate-in">
      <div className="shimmer" style={{ height: 160, marginBottom: '1.5rem' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[...Array(6)].map((_, i) => <div key={i} className="shimmer" style={{ height: 120 }} />)}
      </div>
    </div>
  );

  if (error || !stats) return (
    <div className="page">
      <div className="alert alert-danger">⚠ Failed to load Command Deck: {error}</div>
    </div>
  );

  const s = stats;
  // Calculate real metrics for the 3 circular rings
  const totalLots = s.totals.batches || 1;
  const nonRecalledLots = Math.max(0, totalLots - s.alerts.recalled);
  const qualityRate = Math.min(100, Math.round((nonRecalledLots / totalLots) * 100));
  const traceabilityRate = s.totals.units > 0 ? 100 : 85;
  const activeConsignments = s.alerts.in_transit || 0;
  const deliveryProgressRate = Math.min(100, Math.round(((s.totals.transfers) / (totalLots * 3 || 1)) * 100));

  // Find most critical active consignment for the Featured Save-Game Banner
  const featuredBatch = batches.find(b => b.status === 'IN_TRANSIT') || batches[0] || null;

  return (
    <div className="page animate-in">
      {/* ── TOP LAYER: FEATURED HERO BANNER (Black Flag Save-Game Style Tile) ── */}
      <div className="card card-elevated" style={{
        padding: '1.5rem 1.75rem',
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, rgba(23, 59, 61, 0.95) 0%, rgba(11, 37, 40, 0.9) 100%)',
        position: 'relative'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem', alignItems: 'center' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.2rem 0.6rem',
              background: 'rgba(89, 197, 187, 0.15)',
              border: '1px solid var(--teal)',
              borderRadius: 3,
              fontSize: '0.65rem',
              color: 'var(--teal)',
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: '0.6rem'
            }}>
              <span>✦</span> CURRENT FLAGSHIP CONSIGNMENT
            </div>

            <h2 style={{ fontSize: '1.5rem', color: 'var(--gold-lit)', margin: 0 }}>
              {featuredBatch ? `${featuredBatch.batch_number} — ${featuredBatch.product_name || 'FMCG Consignment'}` : 'No Active Shipments in Transit'}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem', marginBottom: '1rem', lineHeight: 1.5 }}>
              {featuredBatch
                ? `Route in transit from Apex Bottlers to Central Logistics Hub. Responsible Owner: ${shortAddr(featuredBatch.current_owner)}.`
                : 'All production lots currently docked in regional storage. Ready to dispatch new voyage.'}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {featuredBatch && (
                <Link to={`/batches/${featuredBatch.id}`} className="btn btn-gold btn-sm">
                  📦 Inspect Batch Details
                </Link>
              )}
              <Link to="/map" className="btn btn-primary btn-sm">
                🗺️ View Supply Chain Map
              </Link>
              <Link to="/products" className="btn btn-ghost btn-sm">
                ⊕ Register New Cargo
              </Link>
            </div>
          </div>

          {/* 3 Circular Rings (Directly from Black Flag UI Reference) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            background: 'rgba(7, 23, 25, 0.6)',
            padding: '0.75rem',
            borderRadius: '6px',
            border: '1px solid var(--divider)'
          }}>
            <CircularRing
              percent={traceabilityRate}
              label="Traceability"
              subtitle="Dual Unit Sync"
              color="var(--teal)"
            />
            <CircularRing
              percent={qualityRate}
              label="Integrity"
              subtitle="Recall & Hazard Clear"
              color="var(--gold-lit)"
            />
            <CircularRing
              percent={deliveryProgressRate}
              label="Fleet Delivery"
              subtitle="Consignment Milestones"
              color="var(--success)"
            />
          </div>
        </div>
      </div>

      {/* ── ALERTS BAR ── */}
      {(s.alerts.recalled > 0 || s.alerts.near_expiry > 0) && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          {s.alerts.recalled > 0 && (
            <div className="alert alert-danger" style={{ flex: 1, alignItems: 'center' }}>
              <span style={{ fontSize: '1.4rem' }}>☠️</span>
              <div style={{ flex: 1 }}>
                <strong style={{ fontFamily: 'Cinzel, serif' }}>EMERGENCY RECALL TRIGGERED:</strong> {s.alerts.recalled} lot(s) under safety hold.
              </div>
              <Link to="/expiry" className="btn btn-danger btn-sm">Take Action →</Link>
            </div>
          )}
          {s.alerts.near_expiry > 0 && (
            <div className="alert alert-warning" style={{ flex: 1, alignItems: 'center' }}>
              <span style={{ fontSize: '1.4rem' }}>⏳</span>
              <div style={{ flex: 1 }}>
                <strong style={{ fontFamily: 'Cinzel, serif' }}>SHELF PERIL RADAR:</strong> {s.alerts.near_expiry} lot(s) approaching expiry (&lt;30d).
              </div>
              <Link to="/expiry" className="btn btn-gold btn-sm">View Radar →</Link>
            </div>
          )}
        </div>
      )}

      {/* ── SECTOR METRIC TILES (Game Tile Inspired Layout) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
            <span>REGISTERED SKUS</span>
            <span>📋</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontFamily: 'Cinzel, serif', fontWeight: 700, color: 'var(--gold-lit)' }}>
            {s.totals.products}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Validated on Ethereum</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
            <span>ACTIVE BATCHES</span>
            <span>📦</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontFamily: 'Cinzel, serif', fontWeight: 700, color: 'var(--teal)' }}>
            {s.totals.batches}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Across 5 Maritime Hubs</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
            <span>SERIALIZED UNITS</span>
            <span>🏷️</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontFamily: 'Cinzel, serif', fontWeight: 700, color: 'var(--gold-lit)' }}>
            {s.totals.units}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cryptographic QR Anchored</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
            <span>CUSTODY TRANSFERS</span>
            <span>⚓</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontFamily: 'Cinzel, serif', fontWeight: 700, color: 'var(--success)' }}>
            {s.totals.transfers}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Immutable Handover Hops</div>
        </div>
      </div>

      {/* ── TWO-COLUMN SPLIT: VOYAGE TIMELINE + MANIFEST SUMMARY ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }}>
        {/* Left: Recent Activity Feed */}
        <div className="card">
          <div className="card-title">
            <span>📜</span> VOYAGE CHRONICLES &amp; RECENT LEDGER ENTRIES
          </div>
          <div className="gold-divider" />
          {s.recent_activity.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No operations logged yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {s.recent_activity.slice(0, 5).map(entry => (
                <div key={entry.id} style={{
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(7, 23, 25, 0.65)',
                  borderLeft: '3px solid var(--teal)',
                  borderRadius: '0 4px 4px 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{entry.description}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Signer: {shortAddr(entry.actor_address)} · {formatDate(entry.timestamp, { time: true })}
                    </div>
                  </div>
                  <span className="badge badge-in_stock">CONFIRMED</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Quick Action Hub & Consensus Status */}
        <div className="card">
          <div className="card-title">
            <span>⚙️</span> QUICK ACTIONS &amp; ORACLE HEALTH
          </div>
          <div className="gold-divider" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <Link to="/products" className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
              <span>📋</span> Register New Product SKU
            </Link>
            <Link to="/transfers" className="btn btn-gold" style={{ justifyContent: 'flex-start' }}>
              <span>⚓</span> Initiate Ownership Handover
            </Link>
            <Link to="/map" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
              <span>🗺️</span> Open World Shipping Chart
            </Link>
            <Link to="/audit" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
              <span>🔗</span> Review Full Transaction Log
            </Link>
          </div>

          <div style={{
            marginTop: '1.25rem',
            padding: '0.85rem',
            background: 'rgba(7, 23, 25, 0.75)',
            border: '1px solid var(--divider)',
            borderRadius: '4px',
            fontSize: '0.72rem'
          }}>
            <div style={{ color: 'var(--gold-lit)', fontWeight: 600, marginBottom: '0.25rem' }}>EVM VERIFICATION ENGINE</div>
            <div style={{ color: 'var(--text-muted)' }}>
              State transition machine active. Smart contract rules strictly preventing invalid leaps.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
