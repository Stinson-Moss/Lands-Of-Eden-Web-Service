import React, { useEffect, useState } from 'react';
import './Verify.css';

const BACKEND_URL: string = process.env.REACT_APP_BACKEND_LINK || '';
const DISCORD_OAUTH = process.env.REACT_APP_DISCORD_OAUTH || '';

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

const Verify: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    try {
      const storedData = localStorage.getItem('userData');
      if (storedData) {
        setUserData(JSON.parse(storedData));
      }
    } catch (err) {
      setUserData(null);
    }
  }, []);

  const handleDiscordConnect = () => {
    window.location.href = DISCORD_OAUTH;
  };

  const handleRobloxConnect = () => {
    // Replace with your actual Roblox OAuth or verification flow
    window.location.href = `${BACKEND_URL}/api/roblox/auth`;
  };

  return (
    <div className="container">
      <div className="widget">
        <h1 className="title">Link Your Accounts</h1>
        {userData && (userData.discord || userData.roblox) && (
          <div className="connectedAccounts">
            <h2 className="subtitle">Currently Linked</h2>
            {userData.discord && (
              <div className="connectedAccount">
                <img src={userData.discord.avatar} alt="Discord Avatar" className="connectedAvatar" />
                <span className="connectedLabel">Discord:</span>
                <span className="connectedName">{userData.discord.username}#{userData.discord.discriminator}</span>
              </div>
            )}
            {userData.roblox && (
              <div className="connectedAccount">
                <img src={userData.roblox.avatar} alt="Roblox Avatar" className="connectedAvatar" />
                <span className="connectedLabel">Roblox:</span>
                <span className="connectedName">{userData.roblox.displayName} (@{userData.roblox.username})</span>
              </div>
            )}
          </div>
        )}
        <div className="options">
          <button className="connectButton discord" onClick={handleDiscordConnect}>
            Link with Discord
          </button>
          <button className="connectButton roblox" onClick={handleRobloxConnect}>
            Link with Roblox
          </button>
        </div>
      </div>
    </div>
  );
};

export default Verify; 