import React from 'react';
import './Home.css';
import logo from '../assets/logo.png';
import AccountsWidget from '../components/AccountsWidget';
import { Session, User } from '../types/Session';

interface HomeProps {
  session: Session | null;
  user: User | null;
}

const DISCORD_OAUTH = process.env.REACT_APP_DISCORD_OAUTH || '';

const Home: React.FC<HomeProps> = ({ session, user }) => {

  const handleLogin = () => {
    window.location.href = DISCORD_OAUTH;
  };

  return (
    <div className="container">
      <div className="mainContent">
        <div className="welcomeSection">
          <img src={logo} alt="Adam Bot Logo" className="homeLogo" />
          <h1>Welcome to Eden</h1>
          {!user?.discord ? (
            <div 
              className="loginDescription"
              onClick={handleLogin}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              aria-label="Login with Discord"
            >
              <p>Login with Discord to get started</p>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="discordIcon">
                <path d="M19.8 6.4C18.5 5.8 17.1 5.4 15.7 5.2C15.5 5.6 15.3 6 15.1 6.4C13.6 6.2 12.1 6.2 10.6 6.4C10.4 6 10.2 5.6 10 5.2C8.6 5.4 7.2 5.8 5.9 6.4C3.5 10.2 2.8 13.9 3.1 17.5C4.8 18.8 6.7 19.6 8.6 20.1C9.1 19.4 9.5 18.7 9.9 17.9C9.2 17.7 8.6 17.4 8 17C8.1 16.9 8.2 16.8 8.3 16.7C11.3 18.1 14.6 18.1 17.6 16.7C17.7 16.8 17.8 16.9 17.9 17C17.3 17.4 16.6 17.7 16 17.9C16.3 18.7 16.8 19.4 17.3 20.1C19.2 19.6 21.1 18.8 22.8 17.5C23.2 13.2 22.1 9.6 19.8 6.4Z" fill="white"/>
                <path d="M9.2 15.3C8.1 15.3 7.2 14.2 7.2 12.9C7.2 11.6 8.1 10.5 9.2 10.5C10.3 10.5 11.2 11.6 11.2 12.9C11.2 14.2 10.3 15.3 9.2 15.3ZM15.7 15.3C14.6 15.3 13.7 14.2 13.7 12.9C13.7 11.6 14.6 10.5 15.7 10.5C16.8 10.5 17.7 11.6 17.7 12.9C17.7 14.2 16.8 15.3 15.7 15.3Z" fill="white"/>
              </svg>
            </div>
          ) : null}
        </div>
        {user?.discord && <AccountsWidget user={user} />}
      </div>
    </div>
  );
};

export default Home; 