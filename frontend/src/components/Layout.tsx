import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiHome, FiLogOut } from 'react-icons/fi';

export function Layout() {
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    window.location.href = '/login';
  }

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-5 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-sm">Lore</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <FiHome className="w-4 h-4" />
            Workspaces
          </Link>
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</div>
              <div className="text-xs text-gray-500 truncate">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Sign out"
            >
              <FiLogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
