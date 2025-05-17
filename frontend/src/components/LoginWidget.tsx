import React from 'react';
import './LoginWidget.css';
import { User } from '../types/Session';

const BACKEND_URL = process.env.REACT_APP_BACKEND_LINK || '';
const DISCORD_OAUTH = process.env.REACT_APP_DISCORD_OAUTH || '';

function discordAvatarUrl(avatar: string, id: string) {
  return `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`;
}

interface LoginWidgetProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

const LoginWidget: React.FC<LoginWidgetProps> = ({ user, setUser }) => {
  
  const handleLogin = () => {
    window.location.href = DISCORD_OAUTH;
  };

  const handleLogout = async () => {
    await fetch(`${BACKEND_URL}/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
  };


  return (
    <div className="navLoginWidget">
      {user ? (
        <div className="navLoggedIn">
          <img
            src={discordAvatarUrl(user.discord.avatar, user.discord.id)}
            alt="Discord Avatar"
            className="navLoginAvatar"
          />
          <span className="navLoginUsername">{user.discord.username}</span>
          <button className="navLogoutBtn" onClick={handleLogout} aria-label="Logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      ) : (
        <button className="navDiscordLoginBtn" onClick={handleLogin}>
          <span className="navDiscordIcon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.8 6.4C18.5 5.8 17.1 5.4 15.7 5.2C15.5 5.6 15.3 6 15.1 6.4C13.6 6.2 12.1 6.2 10.6 6.4C10.4 6 10.2 5.6 10 5.2C8.6 5.4 7.2 5.8 5.9 6.4C3.5 10.2 2.8 13.9 3.1 17.5C4.8 18.8 6.7 19.6 8.6 20.1C9.1 19.4 9.5 18.7 9.9 17.9C9.2 17.7 8.6 17.4 8 17C8.1 16.9 8.2 16.8 8.3 16.7C11.3 18.1 14.6 18.1 17.6 16.7C17.7 16.8 17.8 16.9 17.9 17C17.3 17.4 16.6 17.7 16 17.9C16.3 18.7 16.8 19.4 17.3 20.1C19.2 19.6 21.1 18.8 22.8 17.5C23.2 13.2 22.1 9.6 19.8 6.4ZM9.2 15.3C8.1 15.3 7.2 14.2 7.2 12.9C7.2 11.6 8.1 10.5 9.2 10.5C10.3 10.5 11.2 11.6 11.2 12.9C11.2 14.2 10.3 15.3 9.2 15.3ZM15.7 15.3C14.6 15.3 13.7 14.2 13.7 12.9C13.7 11.6 14.6 10.5 15.7 10.5C16.8 10.5 17.7 11.6 17.7 12.9C17.7 14.2 16.8 15.3 15.7 15.3Z" fill="white"/>
            </svg>
          </span>
          Login
        </button>
      )}
    </div>
  );
}

export default LoginWidget;