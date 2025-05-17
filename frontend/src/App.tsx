import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import { Session, User } from './types/Session';
import './App.css';
const BACKEND_URL = process.env.REACT_APP_BACKEND_LINK || '';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(localStorage.getItem('session') ? JSON.parse(localStorage.getItem('session') || '{}') : null);
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      window.history.replaceState({}, '', window.location.pathname);
      
      fetch(`${BACKEND_URL}/auth/getUser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code }),
      })
      .then(res => res.json())
      .then(data => {
        setSession(data.session);
        setUser(data.user);
      })
      .catch(() => {
        setSession(null);
        setUser(null);
      });

    } else if (session) {
      const token = session.token;
      const refreshToken = session.refreshToken;
      const expiresIn = session.expiresIn;

      const body = (expiresIn > Date.now() / 1000) ? JSON.stringify({ token: token }) : JSON.stringify({ refresh: refreshToken });

      fetch(`${BACKEND_URL}/auth/getUser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
      })
      .then(res => res.json())
      .then(data => {
        setSession(data.session);
        setUser(data.user);
      })
      .catch(() => {
        setSession(null);
        setUser(null);
      });

    } else {
      setSession(null);
      setUser(null);
    }

    if (session) {
      // save it to a http only cookie
      document.cookie = `session=${JSON.stringify(session)}; path=/; HttpOnly; Secure; SameSite=Strict`;
    } else {
      // remove the cookie
      document.cookie = 'session=; path=/; HttpOnly; Secure; SameSite=Strict; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }, [session]);



  return (
    <Router>
      <div className="app">
        <Navbar user={user}/>
        <Routes>
          <Route path="/" element={<Home session={session} user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App; 