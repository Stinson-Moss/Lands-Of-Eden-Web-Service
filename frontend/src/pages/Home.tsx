import React, { useCallback } from 'react';
import './Home.css';
import logo from '../assets/eden.svg';
import discordIcon from '../assets/discord-icon.svg';
import AccountsWidget from '../components/AccountsWidget';
import { User } from '../types/Session';

interface HomeProps {
  isLoading: boolean;
  user: User | null;
  setUser: (user: User | null) => void;
}

const DISCORD_OAUTH = process.env.REACT_APP_DISCORD_OAUTH || '';

const Home: React.FC<HomeProps> = ({ isLoading, user, setUser }) => {
  const handleLogin = useCallback(() => {
    window.location.href = DISCORD_OAUTH;
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  }, [handleLogin]);

  return (
    <div className="container">
      <div className="mainContent">
        <div className="welcomeSection">
          <img 
            src={logo} 
            alt="Adam Bot Logo" 
            className={`homeLogo ${isLoading ? 'loading' : 'finishedLoading'}`}
          />
          <div className={`${isLoading ? 'loadingCircleContainer' : 'invisible'}`}>
            <div className="loadingCircle">
              <div className="loadingCursor"></div>
            </div>
          </div>
          <div className="welcomeText">
            <h1 className={`${isLoading ? 'hidden' : 'fadeIn'}`}>Welcome to Eden</h1>
          </div>
            <div 
              className={`${isLoading ? 'hidden' : 'loginDescription fadeIn'}`}
              onClick={handleLogin}
              role="button"
              tabIndex={0}
              onKeyDown={handleKeyDown}
              aria-label="Login with Discord"
            >
              <p>Login with Discord to get started</p>
              <img src={discordIcon} alt="Discord" className="discordIcon" />
            </div>
        </div>
          
          <div className={`${isLoading || !user?.discord ? 'invisible' : 'fadeIn'}`}>
            <AccountsWidget user={user} setUser={setUser} />
          </div>
      </div>
    </div>
  );
};

export default React.memo(Home); 