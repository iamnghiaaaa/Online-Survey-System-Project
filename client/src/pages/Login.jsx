import { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const message = location.state?.message || searchParams.get('notice');

  const resolveRedirect = () => {
    const q = searchParams.get('redirect');
    if (q && q.startsWith('/')) return q;
    const from = location.state?.from?.pathname;
    if (from) return from + (location.state.from.search || '');
    return '/';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(resolveRedirect(), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#673ab7] focus:outline-none focus:ring-2 focus:ring-[#673ab7]/25';

  return (
    <div className="min-h-screen bg-[#f6f2fa] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#dadce0] bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-normal text-gray-900 text-center">Đăng nhập</h1>
        <p className="mt-1 text-center text-sm text-gray-500">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-medium text-[#673ab7] hover:underline" state={location.state}>
            Đăng ký
          </Link>
        </p>

        {message && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {message}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#673ab7] py-2.5 text-sm font-medium text-white hover:bg-[#5e35b1] disabled:opacity-60"
          >
            {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
