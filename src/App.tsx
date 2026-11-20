import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import AvatarPage from './pages/AvatarPage';
import DrawResultPage from './pages/DrawResultPage';
import EatPage from './pages/EatPage';
import ProfilePage from './pages/ProfilePage';
import RecordPage from './pages/RecordPage';
import SettingsPage from './pages/SettingsPage';
import StarBoxPage from './pages/StarBoxPage';
import WardrobePage from './pages/WardrobePage';

const tabPaths = ['/record', '/avatar', '/me'];

export default function App() {
  const location = useLocation();
  const showNav = tabPaths.includes(location.pathname);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-[430px] bg-page">
      <Routes>
        <Route path="/" element={<Navigate to="/record" replace />} />
        <Route path="/record" element={<RecordPage />} />
        <Route path="/eat" element={<EatPage />} />
        <Route path="/avatar" element={<AvatarPage />} />
        <Route path="/star-box" element={<StarBoxPage />} />
        <Route path="/draw-result" element={<DrawResultPage />} />
        <Route path="/wardrobe" element={<WardrobePage />} />
        <Route path="/me" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/record" replace />} />
      </Routes>
      {showNav && <BottomNav />}
    </div>
  );
}
