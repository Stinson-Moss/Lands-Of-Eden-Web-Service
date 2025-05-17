import React from 'react';
import './AccountsWidget.css';
import { User } from '../types/Session';

interface AccountsWidgetProps {
  user: User | null;
}

const ROBLOX_OAUTH = process.env.REACT_APP_ROBLOX_OAUTH || '';

const handleRobloxConnect = () => {
  window.location.href = ROBLOX_OAUTH;
};

const AccountsWidget: React.FC<AccountsWidgetProps> = ({ user }) => {
  return (
    <div className="accountsWidget">
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