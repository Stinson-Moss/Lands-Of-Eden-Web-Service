import React from 'react';
import './AccountsWidget.css';

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

interface AccountsWidgetProps {
  userData: UserData | null;
  error?: string | null;
}

const DISCORD_CLIENT_ID = process.env.REACT_APP_DISCORD_CLIENT_ID;
const REDIRECT_URI: string = process.env.REACT_APP_REDIRECT_URI || '';
const BACKEND_URL: string = process.env.REACT_APP_BACKEND_LINK || '';
const DISCORD_OAUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20guilds.join`;

const handleDiscordConnect = () => {
  window.location.href = DISCORD_OAUTH_URL;
};

const handleRobloxConnect = () => {
  window.location.href = `${BACKEND_URL}/api/roblox/auth`;
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
                  src={userData.discord.avatar}
                  alt="Discord Avatar"
                  className="avatar"
                />
                <div className="accountInfo">
                  <h3>Discord</h3>
                  <p>{userData.discord.username}#{userData.discord.discriminator}</p>
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
                  src={userData.roblox.avatar}
                  alt="Roblox Avatar"
                  className="avatar"
                />
                <div className="accountInfo">
                  <h3>Roblox</h3>
                  <p>{userData.roblox.displayName} (@{userData.roblox.username})</p>
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