import { Navigate, Route, Routes } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import AvatarPage from './pages/AvatarPage';
import EatPage from './pages/EatPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import RecordPage from './pages/RecordPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <div className="w-full max-w-[375px] min-h-screen mx-auto bg-cream shadow-xl relative overflow-hidden pb-28">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/eat" element={<EatPage />} />
        <Route path="/record" element={<RecordPage />} />
        <Route path="/avatar" element={<AvatarPage />} />
        <Route path="/me" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}
