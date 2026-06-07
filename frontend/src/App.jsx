import { Routes, Route, BrowserRouter } from 'react-router';
import { Toaster } from 'sonner';

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import NGORegister from './pages/NGORegister'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Report from './pages/Report'
import NGOInvite from './pages/NGOInvite'
import NGODashboard from './pages/NGODashboard'
import MapView from './pages/MapView'
import Campaigns from './pages/Campaigns'
import Leaderboard from './pages/Leaderboard'
import NotFound from './pages/NotFound'
import About from './pages/About'
import HowToUse from './pages/HowToUse'
import Contribute from './pages/Contribute'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/ngo-register" element={<NGORegister />} />
        <Route path="/user-dashboard/:id" element={<UserDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/report" element={<Report />} />
        <Route path="/ngo-invite" element={<NGOInvite />} />
        <Route path="/ngo-dashboard" element={<NGODashboard />} />
        <Route path="/map-view" element={<MapView />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/about" element={<About />} />
        <Route path="/how-to-use" element={<HowToUse />} />
        <Route path="/contribute" element={<Contribute />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
