import React, { useEffect, useState } from 'react';
import { getBatches, getParticipants, getTransfers } from '../services/api';
import { Batch, Participant, Transfer } from '../types';
import { shortAddr, formatDate, statusLabel } from '../utils/helpers';
import { Link } from 'react-router-dom';

// Maritime Geolocation Registry (Corridor Hubs)
interface MaritimeNode {
  id: string;
  name: string;
  type: 'MANUFACTURER' | 'DISTRIBUTOR' | 'WAREHOUSE' | 'RETAILER' | 'PORT';
  coords: { x: number; y: number }; // Percentage coords on canvas (0 to 100)
  location: string;
  wallet: string;
}

const MARITIME_HUBS: MaritimeNode[] = [
  { id: 'hub-1', name: 'Kingston Bottling Plant', type: 'MANUFACTURER', coords: { x: 28, y: 46 }, location: 'Kingston, Jamaica', wallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' },
  { id: 'hub-2', name: 'Nassau Maritime Freight', type: 'DISTRIBUTOR', coords: { x: 44, y: 32 }, location: 'Nassau, Bahamas', wallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' },
  { id: 'hub-3', name: 'Havana Deepwater Cold Hub #4', type: 'WAREHOUSE', coords: { x: 62, y: 54 }, location: 'Havana, Cuba', wallet: '0x90F79bf6EB2c4f870365E785982E1f101E93b906' },
  { id: 'hub-4', name: 'San Juan Supermarket Metro', type: 'RETAILER', coords: { x: 80, y: 68 }, location: 'San Juan, Puerto Rico', wallet: '0x15d34AAf5477673822059258474F761d40026b4f' },
  { id: 'hub-5', name: 'Port Royal Authority & Customs', type: 'PORT', coords: { x: 50, y: 76 }, location: 'Port Royal Corridor', wallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' },
];

export default function SupplyChainMap() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters: All, Shipments, Batches, Manufacturers, Warehouses, Retailers, Exceptions
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<MaritimeNode | null>(MARITIME_HUBS[0]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  useEffect(() => {
    Promise.all([getBatches(), getTransfers()])
      .then(([bRes, tRes]) => {
        setBatches(bRes.data.data || []);
        setTransfers(tRes.data.data || []);
        if (bRes.data.data?.length > 0) setSelectedBatch(bRes.data.data[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredHubs = MARITIME_HUBS.filter(hub => {
    if (activeFilter === 'MANUFACTURERS') return hub.type === 'MANUFACTURER';
    if (activeFilter === 'DISTRIBUTORS') return hub.type === 'DISTRIBUTOR';
    if (activeFilter === 'WAREHOUSES') return hub.type === 'WAREHOUSE';
    if (activeFilter === 'RETAILERS') return hub.type === 'RETAILER';
    if (searchQuery.trim()) {
      return hub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             hub.location.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const inTransitBatches = batches.filter(b => b.status === 'IN_TRANSIT');
  const exceptionBatches = batches.filter(b => b.is_recalled || b.status === 'RECALLED' || b.status === 'DAMAGED');

  return (
    <div className="page animate-in" style={{ paddingBottom: '4rem' }}>
      {/* ── TOP HORIZONTAL FILTER BAR (Screen C Reference) ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(11, 37, 40, 0.85)',
        border: '1px solid var(--divider)',
        borderRadius: '6px',
        padding: '0.6rem 1rem',
        marginBottom: '1rem',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: 'All Sectors' },
            { key: 'SHIPMENTS', label: `Active Routes (${inTransitBatches.length})` },
            { key: 'MANUFACTURERS', label: 'Producers' },
            { key: 'WAREHOUSES', label: 'Cold Hubs' },
            { key: 'RETAILERS', label: 'Retail Outlets' },
            { key: 'EXCEPTIONS', label: `Exceptions (${exceptionBatches.length})` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`btn btn-sm ${activeFilter === f.key ? 'btn-gold' : 'btn-ghost'}`}
              style={{
                fontSize: '0.72rem',
                color: f.key === 'EXCEPTIONS' && exceptionBatches.length > 0 ? 'var(--error)' : undefined
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ width: 260 }}>
          <input
            className="input"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            placeholder="Search port, batch or coordinate…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── INTERACTIVE MARITIME WORLD CHART (Canvas & SVG Routes) ── */}
      <div className="sea-map-canvas" style={{ height: 520, width: '100%', position: 'relative' }}>
        {/* Compass Rose Watermark Overlay */}
        <div style={{
          position: 'absolute', top: '12%', right: '8%',
          fontSize: '12rem', color: 'rgba(205, 187, 114, 0.04)',
          pointerEvents: 'none', userSelect: 'none', lineHeight: 1
        }}>
          ✦
        </div>

        {/* Nautical Latitude/Longitude Grid Lines */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <line x1="0" y1="25%" x2="100%" y2="25%" stroke="rgba(53, 80, 82, 0.3)" strokeDasharray="4 6" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(53, 80, 82, 0.3)" strokeDasharray="4 6" />
          <line x1="0" y1="75%" x2="100%" y2="75%" stroke="rgba(53, 80, 82, 0.3)" strokeDasharray="4 6" />
          <line x1="33%" y1="0" x2="33%" y2="100%" stroke="rgba(53, 80, 82, 0.3)" strokeDasharray="4 6" />
          <line x1="66%" y1="0" x2="66%" y2="100%" stroke="rgba(53, 80, 82, 0.3)" strokeDasharray="4 6" />

          {/* Connected Shipping Route Corridors */}
          <path
            d="M 28% 46% Q 36% 36% 44% 32% T 62% 54% T 80% 68%"
            fill="none"
            stroke="var(--teal)"
            strokeWidth="2.5"
            strokeDasharray="6 6"
            style={{ opacity: 0.85 }}
          />

          {/* Secondary Feeder Line */}
          <path
            d="M 62% 54% L 50% 76%"
            fill="none"
            stroke="var(--gold-dim)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            style={{ opacity: 0.7 }}
          />
        </svg>

        {/* Map Coordinates Floating Header */}
        <div style={{
          position: 'absolute', top: 12, left: 16,
          background: 'rgba(7, 23, 25, 0.85)', padding: '0.35rem 0.65rem',
          borderRadius: 4, border: '1px solid var(--divider)',
          fontSize: '0.68rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)'
        }}>
          LAT: 18°01'N · LNG: 76°47'W · REGION: GREATER ANTILLES
        </div>

        {/* Facility Markers on Map */}
        {filteredHubs.map(hub => {
          const isSelected = selectedNode?.id === hub.id;
          return (
            <div
              key={hub.id}
              onClick={() => setSelectedNode(hub)}
              style={{
                position: 'absolute',
                top: `${hub.coords.y}%`,
                left: `${hub.coords.x}%`,
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                zIndex: 10,
                transition: 'transform 0.2s ease'
              }}
            >
              <div style={{
                width: isSelected ? 34 : 26,
                height: isSelected ? 34 : 26,
                borderRadius: '50%',
                background: isSelected ? 'var(--gold)' : 'var(--bg-panel-elev)',
                border: `2px solid ${isSelected ? 'var(--gold-lit)' : 'var(--teal)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isSelected ? '1rem' : '0.8rem',
                color: isSelected ? '#071719' : 'var(--teal)',
                boxShadow: isSelected ? '0 0 16px var(--gold)' : '0 0 10px rgba(89, 197, 187, 0.4)'
              }}>
                {hub.type === 'MANUFACTURER' ? '🏭' :
                 hub.type === 'DISTRIBUTOR'   ? '🚚' :
                 hub.type === 'WAREHOUSE'     ? '🏢' :
                 hub.type === 'RETAILER'      ? '🏪' : '⚓'}
              </div>
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
                marginTop: 4,
                background: 'rgba(7, 23, 25, 0.9)',
                padding: '0.15rem 0.45rem',
                borderRadius: 3,
                border: '1px solid var(--divider)',
                fontSize: '0.65rem',
                color: isSelected ? 'var(--gold-lit)' : 'var(--text-main)',
                fontFamily: 'Cinzel, serif',
                fontWeight: isSelected ? 700 : 500
              }}>
                {hub.name}
              </div>
            </div>
          );
        })}

        {/* ── FLOATING TACTICAL INSPECTION PANEL (Lower Left) ── */}
        {selectedNode && (
          <div className="card card-elevated" style={{
            position: 'absolute', bottom: 16, left: 16,
            width: 380, maxWidth: '90%', padding: '1rem',
            background: 'rgba(16, 47, 50, 0.92)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--teal)', fontWeight: 700, letterSpacing: '0.1em' }}>
                TACTICAL FACILITY DOSSIER
              </div>
              <span className="badge badge-in_stock">{selectedNode.type}</span>
            </div>

            <h3 style={{ fontSize: '1.05rem', color: 'var(--gold-lit)', margin: '0.35rem 0 0.15rem' }}>
              {selectedNode.name}
            </h3>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Location: {selectedNode.location} · Signer: {shortAddr(selectedNode.wallet)}
            </div>

            <div className="gold-divider" style={{ margin: '0.65rem 0' }} />

            <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
              Active storage &amp; transit hub connected to Caribbean Main Corridor. All inbound cargo requires cryptographic handover confirmation.
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/transfers" className="btn btn-gold btn-sm" style={{ flex: 1 }}>
                ⚓ Transfer Cargo
              </Link>
              <Link to="/products" className="btn btn-ghost btn-sm" style={{ flex: 1 }}>
                Inspect Consignments
              </Link>
            </div>
          </div>
        )}

        {/* ── ACTIVE SHIPMENTS DRAWER (Lower Right) ── */}
        <div className="card" style={{
          position: 'absolute', bottom: 16, right: 16,
          width: 320, padding: '0.85rem',
          background: 'rgba(7, 23, 25, 0.92)'
        }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--gold)', fontFamily: 'Cinzel, serif', fontWeight: 700, marginBottom: '0.4rem' }}>
            CORRIDOR ACTIVITY ({batches.length} LOTS)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: 130, overflowY: 'auto' }}>
            {batches.slice(0, 4).map(b => (
              <div key={b.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.35rem 0.5rem', background: 'rgba(16, 47, 50, 0.5)', borderRadius: 3, fontSize: '0.72rem'
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{b.batch_number}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{b.product_name}</div>
                </div>
                <span className={`badge badge-${b.status.toLowerCase()}`}>{b.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
