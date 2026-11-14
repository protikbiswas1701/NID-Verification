import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FileSearch, History, LayoutDashboard, LogOut, Menu, Settings, Upload, Users, X } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

const NAV = {
  user: [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/app/upload', label: 'Upload NID', icon: Upload },
    { to: '/app/verifications', label: 'My requests', icon: History },
    { to: '/app/settings', label: 'Settings', icon: Settings },
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/verifications', label: 'Verification requests', icon: FileSearch },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ],
};

export default function DashboardLayout({ variant = 'user' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  const sidebar = (
    <div className="flex h-full flex-col bg-navy-900 text-navy-100">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo to={variant === 'admin' ? '/admin' : '/app'} light />
        <button className="text-navy-200 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X size={20} /></button>
      </div>
      {variant === 'admin' && <p className="mx-5 mb-2 mt-1 rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-medium text-ice-200">Administrator panel</p>}
      <nav className="flex-1 space-y-1 px-3 py-3">
        {NAV[variant].map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-white/15 text-white shadow-[inset_3px_0_0_#9cccf5]' : 'text-navy-200 hover:bg-white/10 hover:text-white'}`
            }
          >
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
        <p className="mb-3 truncate text-xs text-navy-300">{user?.email}</p>
        <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-navy-200 hover:bg-white/10 hover:text-white">
          <LogOut size={16} /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%]">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-md p-1.5 text-navy-800 hover:bg-slate-100"><Menu size={22} /></button>
          <Logo to={variant === 'admin' ? '/admin' : '/app'} />
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
