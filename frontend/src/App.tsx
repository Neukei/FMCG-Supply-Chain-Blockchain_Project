import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';

// Lazy-loaded pages
const Landing     = lazy(() => import('./pages/Landing'));
const Dashboard   = lazy(() => import('./pages/Dashboard'));
const Products    = lazy(() => import('./pages/Products'));
const Batches     = lazy(() => import('./pages/Batches'));
const BatchDetail = lazy(() => import('./pages/BatchDetail'));
const Units       = lazy(() => import('./pages/Units'));
const Transfers   = lazy(() => import('./pages/Transfers'));
const Verify      = lazy(() => import('./pages/Verify'));
const Audit       = lazy(() => import('./pages/Audit'));
const Participants = lazy(() => import('./pages/Participants'));
const ExpiryRecall = lazy(() => import('./pages/ExpiryRecall'));
const SupplyChainMap = lazy(() => import('./pages/SupplyChainMap'));
const LogisticsNetwork = lazy(() => import('./pages/LogisticsNetwork'));
const Settings     = lazy(() => import('./pages/Settings'));

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--navy)',
      flexDirection: 'column', gap: '1rem',
    }}>
      <div style={{ fontSize: '2rem' }}>⚓</div>
      <div style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold-dim)',
        fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        Loading…
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="page animate-in">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '60vh', gap: '1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', opacity: 0.3 }}>🗺️</div>
        <h1 className="page-title">404 — Chart Unknown</h1>
        <p className="page-subtitle">These waters are uncharted. The page you seek does not exist.</p>
        <a href="/" className="btn btn-gold" style={{ marginTop: '0.5rem' }}>← Return to Port</a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Landing page (no layout) */}
        <Route path="/" element={<Landing />} />

        {/* App pages (with sidebar layout) */}
        <Route element={<Layout />}>
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="/products"     element={<Products />} />
          <Route path="/products/:id" element={<Products />} />
          <Route path="/batches"      element={<Batches />} />
          <Route path="/batches/:id"  element={<BatchDetail />} />
          <Route path="/units"        element={<Units />} />
          <Route path="/units/:id"    element={<Units />} />
          <Route path="/transfers"    element={<Transfers />} />
          <Route path="/history"      element={<Transfers />} />
          <Route path="/verify"       element={<Verify />} />
          <Route path="/verify/:id"   element={<Verify />} />
          <Route path="/audit"        element={<Audit />} />
          <Route path="/map"          element={<SupplyChainMap />} />
          <Route path="/routes"       element={<LogisticsNetwork />} />
          <Route path="/participants" element={<Participants />} />
          <Route path="/expiry"       element={<ExpiryRecall />} />
          <Route path="/settings"     element={<Settings />} />
          <Route path="*"             element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
