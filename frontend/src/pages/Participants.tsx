import React, { useEffect, useState } from 'react';
import { getParticipants, createParticipant, updateParticipant } from '../services/api';
import { Participant } from '../types';
import { shortAddr } from '../utils/helpers';

export default function Participants() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);

  const [form, setForm] = useState({
    wallet_address: '', name: '', role: 'MANUFACTURER',
    company: '', email: '',
  });

  function load() {
    setLoading(true);
    getParticipants().then(r => setParticipants(r.data.data)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.wallet_address || !form.name) return setFormError('Wallet address and name are required.');
    if (!form.wallet_address.startsWith('0x') || form.wallet_address.length !== 42)
      return setFormError('Enter a valid Ethereum address (0x...)');
    setSubmitting(true); setFormError(null);
    try {
      await createParticipant(form);
      setShowForm(false);
      setForm({ wallet_address:'', name:'', role:'MANUFACTURER', company:'', email:'' });
      load();
    } catch (e: any) { setFormError(e.message); }
    finally { setSubmitting(false); }
  }

  const roleClass = (role: string) =>
    `role-${role.toLowerCase()}`;

  const ROLES = ['ADMIN','MANUFACTURER','DISTRIBUTOR','WAREHOUSE','RETAILER','CUSTOMER'];

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Crew Register</h1>
          <p className="page-subtitle">Supply chain participants and their assigned roles</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>⊕ Add Participant</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal animate-in" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">⊕ Register Participant</h3>
            <div className="alert alert-info" style={{ marginBottom:'1rem', fontSize:'0.78rem' }}>
              ℹ Registering a participant here stores their profile off-chain. To grant on-chain roles,
              the admin must call <code>assignRole()</code> on the smart contract.
            </div>
            {formError && <div className="alert alert-danger" style={{ marginBottom:'1rem' }}>{formError}</div>}
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div className="input-group">
                <label className="label">Ethereum Wallet Address *</label>
                <input className="input" placeholder="0x..." value={form.wallet_address}
                  onChange={e => setForm(f => ({...f, wallet_address: e.target.value}))} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div className="input-group">
                  <label className="label">Full Name *</label>
                  <input className="input" placeholder="Name" value={form.name}
                    onChange={e => setForm(f => ({...f, name: e.target.value}))} />
                </div>
                <div className="input-group">
                  <label className="label">Role *</label>
                  <select className="select" value={form.role}
                    onChange={e => setForm(f => ({...f, role: e.target.value}))}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div className="input-group">
                  <label className="label">Company</label>
                  <input className="input" placeholder="Company name" value={form.company}
                    onChange={e => setForm(f => ({...f, company: e.target.value}))} />
                </div>
                <div className="input-group">
                  <label className="label">Email</label>
                  <input className="input" type="email" placeholder="email@example.com" value={form.email}
                    onChange={e => setForm(f => ({...f, email: e.target.value}))} />
                </div>
              </div>
              <div className="gold-divider" />
              <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '⏳ Saving…' : '⚓ Add to Crew'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
          {[...Array(4)].map((_,i) => <div key={i} className="shimmer" style={{ height:52 }} />)}
        </div>
      ) : participants.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">No Participants Registered</div>
            <div className="empty-state-sub">Add supply chain participants to track their roles and activities.</div>
            <button className="btn btn-gold" style={{ marginTop:'0.5rem' }} onClick={() => setShowForm(true)}>⊕ Add First Participant</button>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="manifest-table">
            <thead>
              <tr><th>Name</th><th>Role</th><th>Wallet Address</th><th>Company</th><th>Email</th><th>Status</th></tr>
            </thead>
            <tbody>
              {participants.map(p => (
                <tr key={p.id}>
                  <td style={{ color:'var(--parchment)', fontWeight:500 }}>{p.name}</td>
                  <td><span className={`role-badge ${roleClass(p.role)}`}>{p.role}</span></td>
                  <td>
                    <code className="tx-hash" style={{ fontSize:'0.78rem' }} title={p.wallet_address}>
                      {shortAddr(p.wallet_address, 8)}
                    </code>
                  </td>
                  <td style={{ fontSize:'0.8rem', color:'var(--text-dim)' }}>{p.company || '—'}</td>
                  <td style={{ fontSize:'0.8rem', color:'var(--text-dim)' }}>{p.email || '—'}</td>
                  <td>
                    <span style={{
                      fontFamily:'Cinzel,serif', fontSize:'0.65rem', letterSpacing:'0.08em',
                      color: p.is_active ? '#70c890' : 'var(--text-dim)',
                    }}>
                      {p.is_active ? '● Active' : '○ Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="alert alert-warning" style={{ marginTop:'1.5rem' }}>
        ⚠ <strong style={{ fontFamily:'Cinzel,serif' }}>Security Note:</strong> On-chain access control is managed
        by the smart contract's <code>assignRole()</code> function. Database records here do not override
        smart contract permissions. Always verify roles on-chain before granting access to sensitive operations.
      </div>
    </div>
  );
}
