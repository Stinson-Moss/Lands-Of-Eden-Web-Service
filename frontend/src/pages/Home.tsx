import React, { useEffect, useState } from 'react';
import './Home.css';
import logo from '../assets/logo.png';
import AccountsWidget from '../components/AccountsWidget.tsx';

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
    const loadUserData = () => {
      try {
        const storedData = localStorage.getItem('userData');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setUserData(parsedData);
        }
      } catch (err) {
        console.error('Error loading user data from localStorage:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
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