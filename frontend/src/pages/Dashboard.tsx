import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../services/api';
import { DashboardStats } from '../types';
import { formatDate, shortAddr } from '../utils/helpers';

function StatCard({ value, label, icon, alert }: { value: number|string; label: string; icon: string; alert?: boolean }) {
  return (
    <div className={`stat-card ${alert && Number(value) > 0 ? 'border-red-900/40' : ''}`}
         style={ alert && Number(value) > 0 ? { borderColor:'rgba(180,40,40,0.4)' } : {}}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.75rem' }}>
        <div className="stat-icon">{icon}</div>
        { alert && Number(value) > 0 && (
          <span style={{ fontSize:'0.6rem', color:'#e86060', fontFamily:'Cinzel,serif', letterSpacing:'0.1em' }}>⚠ ALERT</span>
        )}
      </div>
      <div className="stat-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then(r => setStats(r.data.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Captain's Log</h1>
          <p className="page-subtitle">Supply chain intelligence & fleet overview</p>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'1rem' }}>
        {[...Array(8)].map((_,i) => <div key={i} className="shimmer" style={{ height:120 }} />)}
      </div>
    </div>
  );

  if (error) return (
    <div className="page"><div className="alert alert-danger">⚠ Failed to load: {error}</div></div>
  );

  const s = stats!;
  const breakdownMap = Object.fromEntries((s.batch_status_breakdown || []).map(b => [b.status, b.count]));

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Captain's Log</h1>
          <p className="page-subtitle">Supply chain intelligence &amp; fleet overview — {new Date().toDateString()}</p>
        </div>
        <Link to="/products/new" className="btn btn-primary">⊕ Register Cargo</Link>
      </div>

      {/* Alert banners */}
      {s.alerts.recalled > 0 && (
        <div className="alert alert-danger" style={{ marginBottom:'1rem' }}>
          <span style={{ fontSize:'1.2rem' }}>☠️</span>
          <div>
            <strong style={{ fontFamily:'Cinzel,serif' }}>Recall Alert</strong> — {s.alerts.recalled} batch{s.alerts.recalled !== 1 ? 'es' : ''} recalled.
            <Link to="/expiry" style={{ color:'#e86060', marginLeft:'0.5rem', textDecoration:'underline' }}>View recalls →</Link>
          </div>
        </div>
      )}
      {s.alerts.near_expiry > 0 && (
        <div className="alert alert-warning" style={{ marginBottom:'1rem' }}>
          <span style={{ fontSize:'1.2rem' }}>⏳</span>
          <div>
            <strong style={{ fontFamily:'Cinzel,serif' }}>Expiry Warning</strong> — {s.alerts.near_expiry} batch{s.alerts.near_expiry !== 1 ? 'es' : ''} expiring within 30 days.
            <Link to="/expiry" style={{ color:'#f0c880', marginLeft:'0.5rem', textDecoration:'underline' }}>View alerts →</Link>
          </div>
        </div>
      )}

      {/* Fleet totals */}
      <h4 style={{ fontFamily:'Cinzel,serif', fontSize:'0.75rem', letterSpacing:'0.2em', color:'var(--text-dim)',
        textTransform:'uppercase', marginBottom:'0.75rem' }}>⸻ Fleet Inventory</h4>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'0.875rem', marginBottom:'1.5rem' }}>
        <StatCard value={s.totals.products}  label="Products Registered"  icon="📋" />
        <StatCard value={s.totals.batches}   label="Active Batches"       icon="📦" />
        <StatCard value={s.totals.units}     label="Individual Units"     icon="🏷️" />
        <StatCard value={s.totals.transfers} label="Ownership Transfers"  icon="⚓" />
        <StatCard value={s.totals.participants} label="Crew Members"      icon="👥" />
        <StatCard value={s.alerts.in_transit} label="In Transit"          icon="🚢" />
        <StatCard value={s.alerts.near_expiry} label="Near Expiry"        icon="⏳" alert />
        <StatCard value={s.alerts.recalled}    label="Recalled Batches"   icon="☠️" alert />
      </div>

      {/* Batch status breakdown + recent activity */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        {/* Status breakdown */}
        <div className="card">
          <div className="card-title">📊 Batch Status Breakdown</div>
          <div className="gold-divider" />
          {Object.keys(breakdownMap).length === 0 ? (
            <div className="empty-state" style={{ padding:'1.5rem' }}>
              <div className="empty-state-title">No batches yet</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
              {Object.entries(breakdownMap).map(([status, count]) => {
                const total = s.totals.batches || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={status} style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    <div style={{ width:90, flexShrink:0 }}>
                      <span className={`badge badge-${status.toLowerCase()}`}>{status.replace('_',' ')}</span>
                    </div>
                    <div style={{ flex:1, height:6, background:'rgba(255,255,255,0.05)', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ width:`${pct}%`, height:'100%', background:'var(--gold-dim)', borderRadius:3, transition:'width 0.5s' }} />
                    </div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-dim)', width:40, textAlign:'right' }}>{count}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="card-title">⚡ Recent Ship's Log Entries</div>
          <div className="gold-divider" />
          {s.recent_activity.length === 0 ? (
            <div className="empty-state" style={{ padding:'1.5rem' }}>
              <div className="empty-state-title">No activity yet</div>
            </div>
          ) : (
            <div className="timeline">
              {s.recent_activity.slice(0, 6).map((entry, i) => (
                <div className="timeline-item" key={entry.id}>
                  <div className={`timeline-dot ${
                    entry.event_type.includes('TRANSFER') ? 'dot-transfer' :
                    entry.event_type.includes('RECALL')   ? 'dot-recall' :
                    entry.event_type.includes('REGISTER') ? 'dot-register' : ''
                  }`} />
                  <div className="timeline-content">
                    <div className="timeline-event">{entry.description}</div>
                    <div className="timeline-meta">
                      {shortAddr(entry.actor_address)} · {formatDate(entry.timestamp, { time: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
