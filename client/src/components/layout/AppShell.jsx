import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const navLinkClass = (active) =>
  `text-sm font-medium transition ${
    active ? 'text-[#673ab7]' : 'text-gray-600 hover:text-gray-900'
  }`;

export default function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout, ready } = useAuth();
  const location = useLocation();
  const dash = pathname === '/';
  const build = pathname.startsWith('/surveys/new') || pathname.startsWith('/survey/edit/');

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#f6f2fa] flex items-center justify-center">
        <p className="text-sm text-gray-600">Đang tải…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f6f2fa] flex flex-col">
      <header className="border-b border-[#dadce0] bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="text-lg font-medium text-gray-900 tracking-tight">
            Biểu mẫu
          </Link>
          <nav className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link to="/" className={navLinkClass(dash)}>
              Bảng điều khiển
            </Link>
            <Link to="/surveys/new" className={navLinkClass(build)}>
              Tạo biểu mẫu
            </Link>
            <div className="flex items-center gap-3 border-l border-gray-200 pl-4 sm:pl-6">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-full border border-gray-200 object-cover shadow-sm"
                />
              ) : (
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-[#ede7f6] text-xs font-semibold text-[#5e35b1]"
                  aria-hidden
                >
                  {(user.name || '?').slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="text-sm text-gray-700 max-w-[160px] truncate" title={user.email}>
                {user.name}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Đăng xuất
              </button>
            </div>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
