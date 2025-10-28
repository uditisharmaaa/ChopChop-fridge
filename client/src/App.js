import { useEffect, useState } from 'react';
import ReceiptUpload from './components/ReceiptUpload';
import Dashboard from './components/Dashboard';

export default function App() {
  const [page, setPage] = useState('dashboard'); // default view
  useEffect(() => {
    const saved = localStorage.getItem('page');
    if (saved) setPage(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem('page', page);
  }, [page]);

  if (page === 'scan') {
    return <ReceiptUpload onContinue={() => setPage('dashboard')} />;
  }
  return (
    <Dashboard
      onAddReceipt={() => setPage('scan')}
      onLogout={() => setPage('dashboard')} // no-op fallback
    />
  );
}
