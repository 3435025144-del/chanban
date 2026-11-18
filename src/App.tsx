import { Navigate, Route, Routes } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import AvatarPage from './pages/AvatarPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import RecordPage from './pages/RecordPage';

export default function App() {
  return (
    <div className="w-full max-w-[375px] min-h-screen mx-auto bg-cream shadow-xl relative overflow-hidden pb-24">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/record" element={<RecordPage />} />
        <Route path="/avatar" element={<AvatarPage />} />
        <Route path="/me" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}
