import React, { useEffect, useState } from 'react';
import './Home.css';
import logo from '../assets/logo.png';
import AccountsWidget from '../components/AccountsWidget.tsx';

const BACKEND_URL = process.env.REACT_APP_BACKEND_LINK || '';

interface UserData {
  discord?: {
    username: string;
    discriminator: string;
    avatar: string;
  };
  roblox?: {
    username: string;
    displayName: string;
    avatar: string;
  };
}

const Home: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      // Exchange code with backend
      fetch(`${BACKEND_URL}/api/discord/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
        .then(res => res.json())
        .then(data => {
          setUserData(data.user);
          localStorage.setItem('userData', JSON.stringify(data.user));
          setLoading(false);
          console.log("Caught user data:", data.user);
        })
        .catch(() => {
          setError('Failed to verify account.');
          setLoading(false);
        });
    } else {
      // No code: check localStorage
      const stored = localStorage.getItem('userData');
      if (stored) {
        setUserData(JSON.parse(stored));
      }
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="mainContent">
        <div className="welcomeSection">
          <img src={logo} alt="Adam Bot Logo" className="homeLogo" />
          <h1>Welcome to Eden</h1>
          <p className="description">
            Link your Discord and Roblox accounts.
          </p>
        </div>
        <AccountsWidget userData={userData} error={error} />
      </div>
    </div>
  );
};

export default Home; 