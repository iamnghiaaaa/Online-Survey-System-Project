import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext.jsx';
import AppShell from './components/layout/AppShell.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CreateSurvey from './pages/CreateSurvey.jsx';
import SurveyResponses from './pages/SurveyResponses.jsx';
import ViewSurvey from './pages/ViewSurvey.jsx';
import SurveyResult from './pages/SurveyResult.jsx';
import MySubmission from './pages/MySubmission.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

function PublicHeader({ showAuthLinks = true }) {
  return (
    <header className="border-b border-[#dadce0] bg-white shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="text-lg font-medium text-gray-900 tracking-tight">
          Biểu mẫu
        </Link>
        {showAuthLinks ? (
          <nav className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-[#673ab7]">
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-[#673ab7] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#5e35b1]"
            >
              Đăng ký
            </Link>
          </nav>
        ) : null}
      </div>
    </header>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/survey/:surveyId/result/:responseId"
            element={
              <div className="min-h-screen flex flex-col bg-[#f6f2fa]">
                <PublicHeader showAuthLinks={false} />
                <SurveyResult />
              </div>
            }
          />
          <Route path="/survey/:surveyId" element={<ViewSurvey />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/surveys/new" element={<CreateSurvey />} />
            <Route path="/survey/edit/:surveyId" element={<CreateSurvey />} />
            <Route path="/surveys/:surveyId/responses" element={<SurveyResponses />} />
            <Route path="/my-responses/:responseId" element={<MySubmission />} />
          </Route>
        </Routes>
        <ToastContainer position="top-right" autoClose={4000} />
      </BrowserRouter>
    </AuthProvider>
  );
}
