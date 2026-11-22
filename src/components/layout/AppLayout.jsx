import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen lg:pl-64">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Topbar onMenu={() => setMenuOpen(true)} />
      <main className="p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  );
}
