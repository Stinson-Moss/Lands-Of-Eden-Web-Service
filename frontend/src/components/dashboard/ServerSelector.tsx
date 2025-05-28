import React, { useState } from 'react';
import './ServerSelector.css';
import Server from '../../types/Server';

interface ServerSelectorProps {
  servers: Server[];
  selectedServer: Server | null;
  onSelectServer: (server: Server) => void;
  isLoading: boolean;
}

const ServerSelector: React.FC<ServerSelectorProps> = ({
  servers,
  selectedServer,
  onSelectServer,
  isLoading
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  if (isLoading) {
    return (
      <div className="server-selector-loading">
        <div className="loading-placeholder"></div>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="server-selector-empty">
        <p>No servers found. Make sure the bot is added to your Discord server and you have admin permissions.</p>
      </div>
    );
  }
  
  // Filter servers based on search query
  const filteredServers = servers.filter(server => 
    server.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="server-selector">
      <div className="search-filter">
        <input
          type="text"
          placeholder="Search servers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button 
            className="clear-search" 
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
      
      {filteredServers.length === 0 ? (
        <div className="no-results">
          <p>No servers match your search.</p>
        </div>
      ) : (
        <ul className="server-list">
          {filteredServers.map(server => (
            <li 
              key={server.id}
              className={`server-item ${selectedServer === server ? 'selected' : ''}`}
              onClick={() => onSelectServer(server)}
            >
              <div className="server-icon">
                {server.icon ? (
                  <img src={server.icon} alt={`${server.name} icon`} />
                ) : (
                  <div className="server-icon-placeholder">
                    {server.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="server-details">
                <h3 className="server-name">{server.name}</h3>
                <span className="server-member-count">{server.memberCount} members</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ServerSelector; 