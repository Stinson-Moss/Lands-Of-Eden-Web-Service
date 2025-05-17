import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/logo.png';
import LoginWidget from './LoginWidget';
import { User } from '../types/Session';

interface NavbarProps {
  user: User | null;
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  return (
    <nav className="navbar">
      <div className="navContent">
        <div className="navLeft">
          <Link to="/" className="logo">
            <img src={logo} alt="Adam Bot Logo" className="logoImg" />
            <span className="logoText">Lands of Eden</span>
          </Link>
          <Link to="/" className="navLink">Home</Link>
        </div>
        <div className="navRight">
          {/* <LoginWidget user={user}/> */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 