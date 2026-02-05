import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Workflow, LayoutGrid, HelpCircle, Settings, User } from 'lucide-react';
import useAuthStore from '../store/authStore';
import Toast from './Toast';

export default function Layout({ children }) {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isDesigner = location.pathname.startsWith('/designer');
  const isTester = location.pathname.startsWith('/tester');
  const isSettings = location.pathname === '/settings';
  const user = useAuthStore(s => s.user);

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-gray-100">
      {/* Nav Bar */}
      <nav className="flex-shrink-0 border-b border-slate-700 bg-slate-800/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-white hover:text-synthia-400 transition-colors">
            <Workflow className="w-6 h-6 text-synthia-500" />
            <span>SOP Designer</span>
            <span className="text-xs font-normal text-slate-400 ml-1">by Synthia</span>
          </Link>

          <div className="flex items-center gap-1">
            <NavTab to="/" active={isHome} icon={<LayoutGrid className="w-4 h-4" />} label="My SOPs" />
            {isDesigner && (
              <NavTab to={location.pathname} active={true} icon={<Workflow className="w-4 h-4" />} label="Designer" />
            )}
            {isTester && (
              <NavTab to={location.pathname} active={true} icon={<Workflow className="w-4 h-4" />} label="Tester" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <HowItWorks />
            <Link
              to="/settings"
              className={`flex items-center gap-1 px-2 py-1 text-sm rounded-md transition-colors ${
                isSettings
                  ? 'bg-synthia-500/20 text-synthia-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              <Settings className="w-4 h-4" />
            </Link>
            {user && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-400">{user.name}</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* Toast Container */}
      <Toast />
    </div>
  );
}

function NavTab({ to, active, icon, label }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-synthia-500/20 text-synthia-400'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function HowItWorks() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 text-sm text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-700 transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
        <span className="hidden sm:inline">How it Works</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 p-4">
            <h3 className="text-sm font-bold text-synthia-400 mb-2">🚀 Getting Started</h3>
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
              <li><strong>Create an SOP</strong> — Click "New SOP" on the home page to start a new workflow.</li>
              <li><strong>Design the flow</strong> — Drag nodes from the palette onto the canvas. Connect them by dragging from output handles to input handles.</li>
              <li><strong>Configure nodes</strong> — Click any node to set its name, SLA, and notification rules.</li>
              <li><strong>Configure actions</strong> — Click any edge (connection) to name the action and add required fields.</li>
              <li><strong>Test it</strong> — Go to the Tester to push objects through your SOP and watch them flow through each step.</li>
              <li><strong>Review audit</strong> — Every transition is logged with timestamps, field values, and notification previews.</li>
            </ol>
            <div className="mt-3 pt-2 border-t border-slate-700">
              <p className="text-xs text-slate-400">
                💡 <strong>Tip:</strong> Use Decision nodes for conditional branching and Status nodes for each state an object can be in.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
