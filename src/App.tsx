import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import RecordCenterSheet from './components/RecordCenterSheet';
import AvatarPage from './pages/AvatarPage';
import DrawResultPage from './pages/DrawResultPage';
import FriendsPage from './pages/FriendsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import MealCalendarPage from './pages/MealCalendarPage';
import TrendPage from './pages/TrendPage';
import EatPage from './pages/EatPage';
import ProfilePage from './pages/ProfilePage';
import RecordPage from './pages/RecordPage';
import SettingsPage from './pages/SettingsPage';
import StarBoxPage from './pages/StarBoxPage';
import WardrobePage from './pages/WardrobePage';

const tabPaths = ['/record', '/trend', '/avatar', '/me'];

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const showNav = tabPaths.includes(location.pathname);
  const [recordOpen, setRecordOpen] = useState(false);
  const closeRecord = () => {
    setRecordOpen(false);
    if (location.pathname !== '/record') navigate('/record');
  };

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setRecordOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-[430px] bg-page">
      <Routes>
        <Route path="/" element={<Navigate to="/record" replace />} />
        <Route path="/record" element={<RecordPage onOpenRecord={() => setRecordOpen(true)} />} />
        <Route path="/trend" element={<TrendPage />} />
        <Route path="/eat" element={<EatPage />} />
        <Route path="/avatar" element={<AvatarPage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/star-box" element={<StarBoxPage />} />
        <Route path="/draw-result" element={<DrawResultPage />} />
        <Route path="/wardrobe" element={<WardrobePage />} />
        <Route path="/me" element={<ProfilePage />} />
        <Route path="/meal-calendar" element={<MealCalendarPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/record" replace />} />
      </Routes>
      {showNav && <BottomNav onRecord={() => setRecordOpen(true)} />}
      <RecordCenterSheet open={recordOpen} onClose={closeRecord} />
    </div>
  );
}
