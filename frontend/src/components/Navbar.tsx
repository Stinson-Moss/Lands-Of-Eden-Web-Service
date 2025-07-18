import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/eden.svg';
import LoginWidget from './LoginWidget';
import { User } from '../types/Session';

interface NavbarProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, setUser}) => {
  return (
    <nav className={`navbar`}>
      <div className="navContent">
        <div className="navLeft">
          <Link to="/" className="logo">
            <img src={logo} alt="Adam Bot Logo" className="logoImg" />
            <span className="logoText">Lands of Eden</span>
          </Link>
          <Link to="/" className="navLink">Home</Link>
          {user?.discord && user.discord.id ? <Link to="/Dashboard" className='navLink'>Dashboard</Link> : null}
        </div>
        <div className="navRight">
          <LoginWidget user={user} setUser={setUser}/>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 