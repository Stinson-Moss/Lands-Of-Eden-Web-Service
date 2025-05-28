import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Tokens from './classes/Tokens';
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
      const [domain, csrf] = state?.split('----') || [];

      console.log('STATE:', state)
      
      // if (code && (!csrf || !domain || csrf !== Tokens.getCsrf())) {
      //   window.location.href = '/';
      //   return;
      // }

      // if (code) {
      //   window.history.replaceState({}, '', window.location.pathname);
      // }

      console.log('CODE:', code)
      console.log('DOMAIN:', domain)
      console.log('CSRF:', csrf)

      const body = code ? JSON.stringify({ code }) : null;
      const url = domain && domain === 'roblox' 
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
        setIsLoading(false);
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
          <Route 
            path="/dashboard" 
            element={
            
                <div className="page-transition visible">
                  <Dashboard user={user} />
                </div>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;