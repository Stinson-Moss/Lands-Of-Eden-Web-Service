import React, { useState } from 'react';
import './LoginWidget.css';
import { User } from '../types/Session';
import NegativeConfirmationDialog from './NegativeConfirmationDialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_LINK || '';

function discordAvatarUrl(avatar: string, id: string) {
  return `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`;
}

function discordGuildIconUrl(icon: string, id: string) {
  return `https://cdn.discordapp.com/icons/${id}/${icon}.png`;
}

interface LoginWidgetProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

const LoginWidget: React.FC<LoginWidgetProps> = ({ user, setUser }) => {

  const [showConfirmation, setShowConfirmation] = useState(false);

  const cardInfo = {
    title: 'Logout',
    question: 'Are you sure you want to logout?',
    confirmButtonText: 'Logout',
    cancelButtonText: 'Cancel',
  };

  const handleLogout = async () => {
    await fetch(`${BACKEND_URL}/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  const handleConfirmLogout = async () => {
    await handleLogout();
  };

  const handleCancelLogout = async () => {
    setShowConfirmation(false);
  };

  if (!user) {
    return <></>;
  }


  return (
    <div className="navLoginWidget">
      {showConfirmation && <NegativeConfirmationDialog cardInfo={cardInfo} onConfirm={handleConfirmLogout} onCancel={handleCancelLogout} />}
      <div className="navLoggedIn">
        <img
          src={discordAvatarUrl(user.discord.avatar, user.discord.id)}
            alt="Discord Avatar"
            className="navLoginAvatar"
          />
          <span className="navLoginUsername">{user.discord.username}</span>
          <button className="navLogoutBtn" onClick={() => setShowConfirmation(true)} aria-label="Logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
      </div>
    </div>
  );
}

export default LoginWidget;