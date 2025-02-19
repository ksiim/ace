import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home/Home.tsx';
import Registration from './pages/Registration/Registration.tsx';
import Subscription from './pages/Subscription/Subscription.tsx';
import News from './pages/News/News.tsx';
import Calendar from './pages/Calendar/Calendar.tsx';
import Rating from './pages/Rating/Rating.tsx';

function App() {

  return (
    <Router>
      <Routes>
        <Route path={'/'} element={<Home/>} />
        <Route path={'/registration'} element={<Registration/>} />
        <Route path={'/subscription'} element={<Subscription/>} />
        <Route path={'/news'} element={<News/>} />
        <Route path={'/schedule'} element={<Calendar/>} />
        <Route path={'/rating'} element={<Rating/>} />
      </Routes>
    </Router>
  )
}

export default App
