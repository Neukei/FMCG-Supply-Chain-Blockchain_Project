import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';

export default function Landing() {
  const { connect, isConnected, shortAddress } = useWallet();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #060a12 0%, #0a0f1e 50%, #060c15 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse at 30% 30%, rgba(14,77,107,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(201,165,78,0.06) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />

      {/* Compass rose watermark */}
      <div style={{
        position: 'absolute', bottom: '5%', right: '5%',
        fontSize: '20rem', color: 'rgba(201,165,78,0.03)',
        pointerEvents: 'none', userSelect: 'none', lineHeight: 1
      }}>✦</div>

      <div style={{ position: 'absolute', top: '10%', left: '5%',
        fontSize: '8rem', color: 'rgba(14,77,107,0.08)',
        pointerEvents: 'none', userSelect: 'none', lineHeight: 1 }}>⚓</div>

      {/* Gold top rule */}
      <div style={{ width: 200, height: 1,
        background: 'linear-gradient(90deg,transparent,var(--gold-dim),transparent)',
        marginBottom: '2rem' }} />

      {/* Skull / crest icon */}
      <div style={{ fontSize: '4rem', marginBottom: '1rem', filter: 'drop-shadow(0 0 20px rgba(201,165,78,0.3))' }}>
        ⚔️
      </div>

      {/* Title */}
      <h1 style={{
        fontFamily: 'Cinzel, serif',
        fontSize: 'clamp(1.5rem, 5vw, 2.75rem)',
        fontWeight: 900,
        color: 'var(--gold-lit)',
        textAlign: 'center',
        letterSpacing: '0.1em',
        lineHeight: 1.15,
        textShadow: '0 0 30px rgba(201,165,78,0.3)',
        marginBottom: '0.5rem',
      }}>
        FMCG Supply Chain
      </h1>
      <h2 style={{
        fontFamily: 'Cinzel, serif',
        fontSize: 'clamp(0.8rem, 2vw, 1rem)',
        fontWeight: 400,
        color: 'var(--parch-dim)',
        textAlign: 'center',
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        marginBottom: '0.5rem',
      }}>
        Blockchain Tracking System
      </h2>
      <p style={{
        fontFamily: 'Crimson Text, serif',
        fontStyle: 'italic',
        fontSize: '1rem',
        color: 'var(--text-dim)',
        textAlign: 'center',
        marginBottom: '2.5rem',
      }}>
        "Every product has a story. Ours is written on the blockchain."
      </p>

      {/* Gold divider */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', width:'100%', maxWidth:500, marginBottom:'2.5rem' }}>
        <div style={{ flex:1, height:1, background:'linear-gradient(90deg,transparent,var(--gold-dim))' }} />
        <span style={{ color:'var(--gold-dim)', fontSize:'0.8rem' }}>✦</span>
        <div style={{ flex:1, height:1, background:'linear-gradient(90deg,var(--gold-dim),transparent)' }} />
      </div>

      {/* Description */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', maxWidth:700, marginBottom:'2.5rem', width:'100%' }}>
        {[
          { icon:'📦', title:'Batch Tracking',  desc:'Track every production batch from manufacturer to retailer.' },
          { icon:'🔗', title:'Blockchain Proof', desc:'Immutable records on Ethereum Sepolia testnet.' },
          { icon:'🔍', title:'QR Verification',  desc:'Customers scan a QR code to verify product origin.' },
        ].map(f => (
          <div key={f.title} className="card" style={{ textAlign:'center', padding:'1.25rem' }}>
            <div style={{ fontSize:'1.75rem', marginBottom:'0.5rem' }}>{f.icon}</div>
            <div style={{ fontFamily:'Cinzel,serif', fontSize:'0.75rem', color:'var(--gold-lit)',
              letterSpacing:'0.08em', marginBottom:'0.4rem' }}>{f.title}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-dim)', lineHeight:1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* CTA buttons */}
      <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', justifyContent:'center' }}>
        <Link to="/dashboard" className="btn btn-primary btn-lg">
          🗺️ Enter the Helm
        </Link>
        <Link to="/verify" className="btn btn-gold btn-lg">
          🔍 Verify a Product
        </Link>
        {!isConnected && (
          <button className="btn btn-ghost btn-lg" onClick={connect}>
            🔗 Connect Wallet
          </button>
        )}
      </div>

      {/* Blockchain limitation notice */}
      <div style={{ maxWidth:600, marginTop:'2rem', textAlign:'center' }}>
        <p style={{ fontSize:'0.7rem', color:'var(--text-dim)', lineHeight:1.6,
          background:'rgba(201,165,78,0.04)', border:'1px solid var(--border)',
          borderRadius:6, padding:'0.75rem 1rem' }}>
          ⚠ <strong style={{ color:'var(--gold-dim)' }}>Important Limitation:</strong> This system records what
          supply chain participants <em>report</em>. It cannot verify whether a physical product, its
          manufacturing date, or its origin claim is genuine. A copied QR code could be placed on a
          counterfeit product. Blockchain records are only as reliable as the participants who write them.
        </p>
      </div>

      {/* Bottom rule */}
      <div style={{ width: 200, height: 1,
        background: 'linear-gradient(90deg,transparent,var(--gold-dim),transparent)',
        marginTop: '2rem' }} />
    </div>
  );
}
