import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Tokens from './classes/Tokens';
import { User } from './types/Session';
import './App.css';
import axios from 'axios';
const BACKEND_URL = import.meta.env.VITE_BACKEND_LINK || '';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleAuth = async () => {
      let code = new URLSearchParams(window.location.search).get('code');
      let state = new URLSearchParams(window.location.search).get('state');
      let [domain, csrf] = state?.split('----') || [];

      console.log('STATE:', state)
      
      if (code && (!csrf || !domain || csrf !== Tokens.getCsrf())) {
        console.log('Invalid code or CSRF token')
        console.log(code, csrf, domain, Tokens.getCsrf())
        code = null;
        domain = '';

      }
      
      window.history.replaceState({}, '', window.location.pathname);

      const body = JSON.stringify({ code });
      const url = domain && domain === 'roblox' 
        ? `${BACKEND_URL}/auth/roblox`
        : `${BACKEND_URL}/auth/getUser`;
      
      try {
        const response = await axios.post(url, body, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        });

        const data = response.data;
        
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