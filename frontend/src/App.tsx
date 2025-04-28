import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home/Home.tsx';
import Registration from './pages/Registration/Registration.tsx';
import Subscription from './pages/Subscription/Subscription.tsx';
import News from './pages/News/News.tsx';
import Calendar from './pages/Calendar/Calendar.tsx';
import Rating from './pages/Rating/Rating.tsx';
import TournamentPage from './pages/Tournament/TournamentPage.tsx';
import LoginPage from './pages/LoginPage/LoginPage.tsx';
import Profile from './pages/Profile/Profile.tsx';
import AdminPanel from './pages/AdminPanel/AdminPanel.tsx';
import CreateNews from './pages/CreateNews/CreateNews.tsx';
import Trainers from './pages/Trainers/Trainers.tsx';
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage.tsx';
import Cookies from './components/Cookies/Cookies.tsx';

function App() {
    return (
        <Router>
            <div>
                <Routes>
                    <Route path={'/admin'} element={<AdminPanel />} />
                    <Route path={'/create-news/:newsId?'} element={<CreateNews />} />
                    <Route path={'/'} element={<Home />} />
                    <Route path={'/login'} element={<LoginPage />} />
                    <Route path={'/reset-password'} element={<ResetPasswordPage />} />
                    <Route path={'/profile'} element={<Profile />} />
                    <Route path={'/registration'} element={<Registration />} />
                    <Route path={'/subscription'} element={<Subscription />} />
                    <Route path={'/news'} element={<News />} />
                    <Route path={'/schedule'} element={<Calendar />} />
                    <Route path={'/trainers'} element={<Trainers />} />
                    <Route path={'/tournaments/:tournamentId'} element={<TournamentPage />} />
                    <Route path={'/rating'} element={<Rating />} />
                    <Route path={'*'} element={<div>404 Not Found</div>} />
                </Routes>
                <Cookies />
            </div>
        </Router>
    );
}

export default App;