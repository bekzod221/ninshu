import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Detail from './pages/Detail';
import Watch from './pages/Watch';
import Search from './pages/Search';
import './App.css';
import { Analytics } from "@vercel/analytics/react"

function App() {
  return (
    <Router>
      <Analytics/>
      <div className="app">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/anime/:id" element={<Detail />} />
          <Route path="/watch/:id/:videoId" element={<Watch />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
