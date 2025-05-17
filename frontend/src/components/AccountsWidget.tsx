import React, { useState } from 'react';
import './AccountsWidget.css';
import { User } from '../types/Session';

interface AccountsWidgetProps {
  user: User | null;
}

const BACKEND_URL = process.env.REACT_APP_BACKEND_LINK || '';
const ROBLOX_OAUTH = process.env.REACT_APP_ROBLOX_OAUTH || '';

const AccountsWidget: React.FC<AccountsWidgetProps> = ({ user }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleRobloxConnect = () => {
    if (user?.roblox) {
      // Show confirmation dialog instead of immediately unlinking
      setShowConfirmation(true);
    } else {
      window.location.href = ROBLOX_OAUTH;
    }
  };

  const handleUnlink = () => {
    fetch(`${BACKEND_URL}/unlink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          window.location.reload();
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

  return (
    <div className="accountsWidget">
      {showConfirmation && (
        <div className="confirmationOverlay">
          <div className="confirmationDialog">
            <h3>Unlink Account</h3>
            <p>Are you sure you want to unlink your Roblox account?</p>
            <div className="confirmationButtons">
              <button className="cancelButton" onClick={handleCancelUnlink}>Cancel</button>
              <button className="confirmButton" onClick={handleUnlink}>Unlink</button>
            </div>
          </div>
        </div>
      )}
      <div className="accountSection">
        <h2>Connect Your Roblox Account</h2>
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