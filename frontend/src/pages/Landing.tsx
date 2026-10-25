import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';

export default function Landing() {
  const { connect, isConnected, shortAddress } = useWallet();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 20%, rgba(84, 209, 198, 0.22) 0%, transparent 70%), linear-gradient(180deg, #051417 0%, #02090b 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Floating Bokeh Particle Layer */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        pointerEvents: 'none',
        backgroundImage: `
          radial-gradient(circle 3px at 20% 20%, rgba(126, 255, 244, 0.8) 100%, transparent),
          radial-gradient(circle 4px at 80% 30%, rgba(84, 209, 198, 0.6) 100%, transparent),
          radial-gradient(circle 5px at 30% 70%, rgba(84, 209, 198, 0.5) 100%, transparent),
          radial-gradient(circle 3px at 70% 80%, rgba(126, 255, 244, 0.7) 100%, transparent),
          radial-gradient(circle 24px at 50% 40%, rgba(84, 209, 198, 0.08) 100%, transparent)
        `,
        opacity: 0.8,
      }} />

      {/* Decorative Gold Header Rule */}
      <div style={{
        width: 180, height: 2,
        background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
        marginBottom: '2rem',
      }} />

      {/* Black Flag Emblem Crest */}
      <div style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(84, 209, 198, 0.25) 0%, rgba(205, 187, 114, 0.2) 100%)',
        border: '2px solid var(--gold)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2.5rem',
        boxShadow: '0 0 35px rgba(205, 187, 114, 0.4), inset 0 0 20px rgba(84, 209, 198, 0.3)',
        marginBottom: '1.5rem',
      }}>
        ⚓
      </div>

      {/* Main Title */}
      <h1 style={{
        fontFamily: 'Cinzel, serif',
        fontSize: 'clamp(2rem, 5vw, 3.25rem)',
        fontWeight: 900,
        color: 'var(--gold-lit)',
        textAlign: 'center',
        letterSpacing: '0.12em',
        lineHeight: 1.1,
        textShadow: '0 0 30px rgba(205, 187, 114, 0.4), 0 0 60px rgba(84, 209, 198, 0.2)',
        margin: '0 0 0.5rem',
      }}>
        BLACK FLAG FMCG
      </h1>

      <h2 style={{
        fontFamily: 'Cinzel, serif',
        fontSize: 'clamp(0.85rem, 2vw, 1.1rem)',
        fontWeight: 600,
        color: 'var(--teal-bright)',
        textAlign: 'center',
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        margin: '0 0 1.25rem',
        textShadow: '0 0 12px rgba(84, 209, 198, 0.5)',
      }}>
        BLOCKCHAIN SUPPLY CHAIN COMMAND
      </h2>

      <p style={{
        fontStyle: 'italic',
        fontSize: '1.05rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
        maxWidth: 620,
        lineHeight: 1.6,
        marginBottom: '2.5rem',
      }}>
        "From Caribbean distillery to global ports — every production batch and serialized bottle verified on the sovereign Ethereum ledger."
      </p>

      {/* 3 Core Pillar Feature Cards (Smoked Glass Style) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        maxWidth: 880,
        width: '100%',
        marginBottom: '2.5rem',
      }}>
        {[
          {
            icon: '📋',
            title: 'Batch Lot Traceability',
            desc: 'Multi-tiered custody tracking across manufacturers, distributors, and warehouses.',
          },
          {
            icon: '🛡️',
            title: 'Smart Contract Proof',
            desc: 'AccessControl role gating and immutable event logs on Ethereum Sepolia.',
          },
          {
            icon: '🔍',
            title: 'QR Consumer Verifier',
            desc: 'Zero-wallet public verification terminal for anti-counterfeit inspection.',
          },
        ].map(card => (
          <div key={card.title} className="card card-featured" style={{ textAlign: 'center', padding: '1.5rem 1.25rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{card.icon}</div>
            <h3 style={{ fontSize: '0.88rem', color: 'var(--gold-lit)', marginBottom: '0.4rem' }}>{card.title}</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{card.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA Buttons */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/dashboard" className="btn btn-gold btn-lg">
          ⚓ Take the Helm (Dashboard)
        </Link>
        <Link to="/map" className="btn btn-primary btn-lg">
          🗺️ Caribbean Supply Map
        </Link>
        <Link to="/verify" className="btn btn-ghost btn-lg">
          🔍 Verify Product QR
        </Link>
      </div>

      {/* Bottom Rule */}
      <div style={{
        width: 180, height: 2,
        background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
        marginTop: '2.5rem',
      }} />
    </div>
  );
}
