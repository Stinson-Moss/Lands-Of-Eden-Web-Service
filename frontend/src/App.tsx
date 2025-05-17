import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import { User } from './types/Session';
import './App.css';
const BACKEND_URL = process.env.REACT_APP_BACKEND_LINK || '';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    window.history.replaceState({}, '', window.location.pathname);

    const body = code? JSON.stringify({code: code}) : null;
      
    fetch(`${BACKEND_URL}/auth/getUser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
      credentials: 'include',
    })
    .then(res => res.json())
    .then(data => {
      setUser(data.user);
    })
    .catch(() => {
      setUser(null);
    });
  }, []);



  return (
    <Router>
      <div className="app">
        <Navbar user={user} setUser={setUser}/>
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App; 