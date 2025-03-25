// import './App.css';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Header from './components/Header';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Channels from './pages/Channels';
import ChannelView from './pages/ChannelView';


function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/channels" element={<Channels />} />
        <Route path="/channel/:id" element={<ChannelView />} />
      </Routes>
    </Router>
  )
}

export default App;


