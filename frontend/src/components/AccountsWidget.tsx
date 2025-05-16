import React from 'react';
import './AccountsWidget.css';
import { UserDataTemplate } from '../types/UserData';

interface AccountsWidgetProps {
  userData: UserDataTemplate | null;
  error?: string | null;
}

const DISCORD_OAUTH = process.env.REACT_APP_DISCORD_OAUTH || '';
const ROBLOX_OAUTH = process.env.REACT_APP_ROBLOX_OAUTH || '';

function discordAvatarUrl(avatarHash: string, userId: string) {
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png`;
}

const handleDiscordConnect = () => {
  window.location.href = DISCORD_OAUTH;
};

const handleRobloxConnect = () => {
  window.location.href = ROBLOX_OAUTH;
};

const AccountsWidget: React.FC<AccountsWidgetProps> = ({ userData, error }) => {
  return (
    <div className="accountsWidget">
      {error ? (
        <div className="error">
          <p>Error: {error}</p>
          <p className="errorHelp">Please try refreshing the page.</p>
        </div>
      ) : (
        <div className="accountSection">
          <h2>Connected Accounts</h2>
          <div
            className="account discord"
            onClick={handleDiscordConnect}
            style={{ cursor: 'pointer' }}
            tabIndex={0}
            role="button"
            aria-label="Connect Discord"
          >
            {userData?.discord ? (
              <div className="accountHeader">
                <img
                  src={discordAvatarUrl(userData.discord.avatar, userData.discord.id)}
                  alt="Discord Avatar"
                  className="avatar"
                />
                <div className="accountInfo">
                  <h3>Discord</h3>
                  <p>{userData.discord.username}</p>
                </div>
              </div>
            ) : (
              <div className="accountHeader">
                <div className="accountInfo">
                  <h3>Discord</h3>
                  <p>Not connected</p>
                </div>
              </div>
            )}
          </div>

          <div
            className="account roblox"
            onClick={handleRobloxConnect}
            style={{ cursor: 'pointer' }}
            tabIndex={0}
            role="button"
            aria-label="Connect Roblox"
          >
            {userData?.roblox ? (
              <div className="accountHeader">
                <img
                  src={userData.roblox.picture}
                  alt="Roblox Avatar"
                  className="avatar"
                />
                <div className="accountInfo">
                  <h3>Roblox</h3>
                  <p>{userData.roblox.displayname} (@{userData.roblox.username})</p>
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
      )}
    </div>
  );
};

export default AccountsWidget; 