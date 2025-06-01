import './AccountsWidget.css';
import React, { useState } from 'react';
import NegativeConfirmationDialog from './NegativeConfirmationDialog';
import axios from 'axios';
import Tokens from '../classes/Tokens';
import { User } from '../types/Session';

interface AccountsWidgetProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_LINK || '';
const ROBLOX_OAUTH = import.meta.env.VITE_ROBLOX_OAUTH || '';

const AccountsWidget: React.FC<AccountsWidgetProps> = ({ user, setUser }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleRobloxConnect = () => {
    if (user?.roblox) {
      // Show confirmation dialog instead of immediately unlinking
      setShowConfirmation(true);
    } else {
      const state = crypto.randomUUID();
      Tokens.setCsrf(state);
      window.location.href = `${ROBLOX_OAUTH}----${state}`;
    }
  };

  const handleUnlink = () => {
    axios.post(`${BACKEND_URL}/auth/unlink`, {}, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true
    })
      .then(res => res.data)
      .then(data => {
        if (data.success) {
          if (!user) {
            return;
          }

          setUser({
            discord: user.discord,
            roblox: null
          })
        }
      })
      .catch(error => {
        console.error('Error unlinking account:', error);
      })
      .finally(() => {
        setShowConfirmation(false);
      });
  };

  const handleCancelUnlink = () => {
    setShowConfirmation(false);
  };

  const cardInfo = {
    title: 'Unlink Account',
    question: 'Are you sure you want to unlink your Roblox account?',
    confirmButtonText: 'Unlink',
    cancelButtonText: 'Cancel',
  };

  return (
    <div className="accountsWidget">
      {showConfirmation && <NegativeConfirmationDialog cardInfo={cardInfo} onConfirm={handleUnlink} onCancel={handleCancelUnlink} />}
      <div className="accountSection">
        <h2>Link Your Roblox Account</h2>
          <div
            className="account roblox"
            onClick={handleRobloxConnect}
            style={{ cursor: 'pointer' }}
            tabIndex={0}
            role="button"
            aria-label="Connect Roblox"
          >
            {user?.roblox ? (
              <div className="accountHeader">
                <img
                  src={user.roblox.avatar}
                  alt="Roblox Avatar"
                  className="avatar"
                />
                <div className="accountInfo">
                  <h3>Roblox</h3>
                  <p>{user.roblox.displayname} (@{user.roblox.username})</p>
                </div>
              </div>
            ) : (
              <div className="accountHeader">
                <div className="accountInfo">
                  <h3>Roblox</h3>
                  <p>Not connected</p>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AccountsWidget; 