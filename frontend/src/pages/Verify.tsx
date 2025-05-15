import React, { useState, useEffect } from 'react';
import './Verify.css';

const DISCORD_CLIENT_ID = process.env.REACT_APP_DISCORD_CLIENT_ID;
const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI || 'http://localhost:3000/verify';
const DISCORD_OAUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20guilds.join`;

console.log(DISCORD_CLIENT_ID);

const Verify: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      handleOAuthCallback(code);
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleOAuthCallback = async (code: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/discord/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange token');
      }

      const data = await response.json();
      setUser(data.user);
      setIsLoading(false);
    } catch (error) {
      console.error('OAuth callback error:', error);
      setError('Failed to verify your account. Please try again.');
      setIsLoading(false);
    }
  };

  const handleVerifyClick = () => {
    window.location.href = DISCORD_OAUTH_URL;
  };

  return (
    <div className="container">
      <div className="content">
        <h1 className="title">Verify Your Account</h1>
        {isLoading ? (
          <div className="loadingContainer">
            <div className="loadingSpinner"></div>
            <p className="loadingText">Loading...</p>
          </div>
        ) : error ? (
          <div className="errorContainer">
            <p className="errorText">{error}</p>
            <button 
              className="verifyButton"
              onClick={handleVerifyClick}
            >
              Try Again
            </button>
          </div>
        ) : user ? (
          <div className="successContainer">
            <p className="successText">
              Welcome, {user.username}!
            </p>
            <p className="description">
              Your account has been successfully verified.
            </p>
          </div>
        ) : (
          <div className="verificationContent">
            <p className="description">
              Please connect your Discord account to continue.
            </p>
            <button 
              className="verifyButton"
              onClick={handleVerifyClick}
            >
              Connect with Discord
            </button>
          </div>
        )}
      </div>
      <footer className="footer">
        <p>© 2024 Your Company Name</p>
        <div className="footerLinks">
          <a href="/terms">Terms of Service</a>
          <a href="/privacy">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
};

export default Verify; 