import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const TITLES: Record<string, string> = {
  '/':            'Port of Entry',
  '/dashboard':   "Captain's Log",
  '/products':    'Product Registry',
  '/batches':     'Batch Manifest',
  '/units':       'Unit Ledger',
  '/transfers':   'Transfer Operations',
  '/history':     'Voyage History',
  '/expiry':      'Peril & Recall',
  '/verify':      'Cargo Verification',
  '/audit':       'Transaction Log',
  '/participants':'Crew Register',
};

export default function Layout() {
  const location = useLocation();
  const routeKey = Object.keys(TITLES).find(k =>
    k === '/' ? location.pathname === '/' : location.pathname.startsWith(k)
  ) || '/';
  const title = TITLES[routeKey] || 'FMCG Supply Chain';

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-breadcrumb">
            FMCG Chain &rsaquo; <span>{title}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <span className="network-badge">
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#40c870', display:'inline-block',
                boxShadow:'0 0 5px rgba(64,200,112,0.5)' }} />
              API Online
            </span>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
