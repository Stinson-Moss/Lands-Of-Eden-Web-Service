import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import { User } from './types/Session';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_LINK || '';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleAuth = async () => {
      const code = new URLSearchParams(window.location.search).get('code');
      const state = new URLSearchParams(window.location.search).get('state');
      
      if (code || state) {
        window.history.replaceState({}, '', window.location.pathname);
      }

      const body = code ? JSON.stringify({ code }) : null;
      const url = state && state === 'roblox' 
        ? `${BACKEND_URL}/auth/roblox`
        : `${BACKEND_URL}/auth/getUser`;
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          credentials: 'include',
        });
        const data = await response.json();
        
        if (data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('ERROR:', e);
        setUser(null);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 8000);
      }
    };

    handleAuth();
  }, []);

  return (
    <Router>
      <div className={`app ${isLoading ? 'loading' : ''}`}>
        <Navbar 
          user={user} 
        setUser={setUser}
      />
      <Routes>
        <Route 
          path="/" 
          element={<Home isLoading={isLoading} user={user} setUser={setUser} />} 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
    </Router>
  );
};

export default App;