import React, { useEffect, useState } from 'react';
import { getTransfers, getBatches } from '../services/api';
import { Transfer, Batch } from '../types';
import { shortAddr, formatDate } from '../utils/helpers';
import { Link } from 'react-router-dom';

interface Corridor {
  id: string;
  name: string;
  origin: string;
  destination: string;
  carrier: string;
  eta: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'PERIL';
  activeConsignments: number;
}

const SHIPPING_CORRIDORS: Corridor[] = [
  { id: 'corridor-1', name: 'Kingston ➔ Nassau Line', origin: 'Kingston Bottling Plant', destination: 'Nassau Maritime Freight', carrier: 'TransGlobal Cargo Fleet', eta: '18 Hours', riskLevel: 'LOW', activeConsignments: 3 },
  { id: 'corridor-2', name: 'Nassau ➔ Havana Coldway', origin: 'Nassau Maritime Freight', destination: 'Havana Deepwater Cold Hub', carrier: 'ArcticWave Reefers', eta: '34 Hours', riskLevel: 'LOW', activeConsignments: 2 },
  { id: 'corridor-3', name: 'Havana ➔ San Juan Final Mile', origin: 'Havana Cold Hub #4', destination: 'San Juan Metro Retailers', carrier: 'Island Express Shuttles', eta: '8 Hours', riskLevel: 'LOW', activeConsignments: 1 },
  { id: 'corridor-4', name: 'Port Royal Quarantine Channel', origin: 'Central Hub', destination: 'Inspection Bay B', carrier: 'Customs Patrol', eta: 'HOLD', riskLevel: 'PERIL', activeConsignments: 1 },
];

export default function LogisticsNetwork() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedCorridor, setSelectedCorridor] = useState<Corridor>(SHIPPING_CORRIDORS[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTransfers(), getBatches()])
      .then(([tRes, bRes]) => {
        setTransfers(tRes.data.data || []);
        setBatches(bRes.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Logistics Network &amp; Corridors</h1>
          <p className="page-subtitle">Kenway fleet companion architecture — regional shipping routes &amp; consignment velocity</p>
        </div>
        <Link to="/transfers" className="btn btn-gold btn-sm">
          ⊕ Dispatch New Consignment
        </Link>
      </div>

      {/* ── TWO-COLUMN SPLIT: CORRIDORS LIST (Left) + ROUTE VISUALIZATION (Right) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Left Regional Corridors List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{
            fontSize: '0.68rem',
            fontFamily: 'Cinzel, serif',
            color: 'var(--gold-lit)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '0.2rem'
          }}>
            Available Shipping Corridors
          </div>

          {SHIPPING_CORRIDORS.map(corridor => {
            const isSelected = selectedCorridor.id === corridor.id;
            return (
              <div
                key={corridor.id}
                onClick={() => setSelectedCorridor(corridor)}
                style={{
                  background: isSelected ? 'var(--bg-panel-elev)' : 'var(--bg-panel)',
                  border: isSelected ? '1px solid var(--gold)' : '1px solid var(--divider)',
                  borderRadius: 6,
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 0 16px rgba(205, 187, 114, 0.2)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 600, fontSize: '0.9rem', color: isSelected ? 'var(--gold-lit)' : 'var(--text-main)' }}>
                    {corridor.name}
                  </div>
                  <span className={`badge ${corridor.riskLevel === 'PERIL' ? 'badge-recalled' : 'badge-in_stock'}`}>
                    {corridor.riskLevel} RISK
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Carrier: {corridor.carrier} · ETA: {corridor.eta}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.65rem', fontSize: '0.72rem', borderTop: '1px solid rgba(53, 80, 82, 0.4)', paddingTop: '0.45rem' }}>
                  <span style={{ color: 'var(--teal)' }}>Active Cargo: {corridor.activeConsignments} lot(s)</span>
                  <span style={{ color: 'var(--text-muted)' }}>Status: Active Voyage</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Route Node & Milestone Visualization */}
        <div className="card card-elevated" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-title">
            <span>🚢</span> CORRIDOR DISPATCH: {selectedCorridor.name.toUpperCase()}
          </div>
          <div className="gold-divider" />

          {/* Connected Waypoint Visualization */}
          <div style={{
            background: 'rgba(7, 23, 25, 0.8)',
            padding: '1.5rem',
            borderRadius: 6,
            border: '1px solid var(--divider)',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🏭</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gold-lit)' }}>ORIGIN EMBARKATION</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{selectedCorridor.origin}</div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 1rem' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--teal)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '0.2rem' }}>
                  ETA: {selectedCorridor.eta}
                </span>
                <div style={{ width: '100%', height: 2, background: 'linear-gradient(90deg, var(--teal), var(--gold))', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: -4, left: '50%', width: 10, height: 10, borderRadius: '50%', background: 'var(--gold-lit)', transform: 'translateX(-50%)' }} />
                </div>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>CARGO IN TRANSIT</span>
              </div>

              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🏢</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gold-lit)' }}>DESTINATION DEBARKATION</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{selectedCorridor.destination}</div>
              </div>
            </div>
          </div>

          {/* Consignments Traveling along this corridor */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--gold-lit)', fontFamily: 'Cinzel, serif', marginBottom: '0.65rem' }}>
              RECORDED WAYBILL CONSIGNMENTS IN THIS SECTOR
            </div>

            {transfers.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No waybills recorded</div>
            ) : (
              <div className="table-wrap">
                <table className="manifest-table">
                  <thead>
                    <tr><th>Waybill Ref</th><th>Sender Address</th><th>Recipient Address</th><th>Status</th><th>Timestamp</th></tr>
                  </thead>
                  <tbody>
                    {transfers.slice(0, 5).map(t => (
                      <tr key={t.id}>
                        <td><code style={{ color: 'var(--gold-lit)' }}>{t.shipment_ref || 'SHIP-001'}</code></td>
                        <td>{shortAddr(t.from_address)}</td>
                        <td>{shortAddr(t.to_address)}</td>
                        <td><span className="badge badge-in_stock">{t.status_after}</span></td>
                        <td>{formatDate(t.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
