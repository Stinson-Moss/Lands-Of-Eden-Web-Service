import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/logo.png';

const Navbar: React.FC = () => {
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
      </div>
    </nav>
  );
};

export default Navbar; 