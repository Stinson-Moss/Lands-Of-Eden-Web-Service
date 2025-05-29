import React, { useState } from 'react';
import './GroupManager.css';
import Group from '../../types/Group';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_LINK || '';

interface GroupManagerProps {
  groups: Group[];
  onAddGroup: (group: Group) => void;
  onRemoveGroup: (targetGroup: Group) => void;
  isLoading: boolean;
}

const GroupManager: React.FC<GroupManagerProps> = ({
  groups,
  onAddGroup,
  onRemoveGroup,
  isLoading
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [groupIdInput, setGroupIdInput] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  const handleAddClick = () => {
    setIsAdding(true);
    setGroupIdInput('');
    setSearchError(null);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setGroupIdInput('');
    setSearchError(null);
  };

  const handleSearch = async () => {
    if (!groupIdInput.trim()) {
      setSearchError('Please enter a group name');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const foundGroupResponse = await axios.get(`${BACKEND_URL}/api/group/${groupIdInput}`);
      const foundGroupData = foundGroupResponse.data;

      if (groups.some(group => group.Name === foundGroupData.Name)) {
        setSearchError('This group is already added');
        return;
      }

      onAddGroup(foundGroupData);
    } catch (error) {
      setSearchError('Failed to find group. Please check the name and try again.');
    } finally {
      setIsAdding(false);
      setGroupIdInput('');
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      handleCancelAdd();
    }
  };

  // Filter groups based on the filter query
  const filteredGroups = groups.filter(group => 
    group.Name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="group-manager-loading">
        <div className="loading-placeholder"></div>
      </div>
    );
  }

  return (
    <div className="group-manager">
      {groups.length > 0 && (
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search groups..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="search-input"
          />
          {filterQuery && (
            <button 
              className="clear-search" 
              onClick={() => setFilterQuery('')}
              aria-label="Clear filter"
            >
              ×
            </button>
          )}
        </div>
      )}
      
      <div className="group-list-container">
        {groups.length === 0 && !isAdding ? (
          <div className="empty-group-list">
            <p>No Roblox groups added yet.</p>
            <button 
              className="add-group-button"
              onClick={handleAddClick}
            >
              <span className="add-icon">+</span>
              <span>Add Group</span>
            </button>
          </div>
        ) : filteredGroups.length === 0 && !isAdding ? (
          <div className="no-results">
            <p>No groups match your filter.</p>
            <button 
              className="clear-filter-button"
              onClick={() => setFilterQuery('')}
            >
              Clear Filter
            </button>
          </div>
        ) : (
          <ul className="group-list">
            {filteredGroups.map(group => (
              <li key={group.Name} className="group-item">
                <div className="group-thumbnail">
                  {group.Icon ? (
                    <img src={group.Icon} alt={`${group.Name} thumbnail`} />
                  ) : (
                    <div className="group-thumbnail-placeholder"></div>
                  )}
                </div>
                <div className="group-info">
                  <h3 className="group-name">{group.Name}</h3>
                  {group.Parent && (
                    <div className="group-parent">
                      <span className="parent-label">Parent:</span> {group.Parent}
                    </div>
                  )}
                  {group.IsPublic !== undefined && (
                    <div className="group-visibility">
                      {group.IsPublic ? 'Public' : 'Private'}
                    </div>
                  )}
                </div>
                <button 
                  className="remove-group-button"
                  onClick={() => onRemoveGroup(group)}
                  aria-label={`Remove ${group.Name}`}
                >
                  <span className="remove-icon">×</span>
                </button>
              </li>
            ))}
            
            {isAdding && (
              <li className="group-item add-group-form">
                <div className="group-search-input">
                  <input
                    type="text"
                    value={groupIdInput}
                    onChange={(e) => setGroupIdInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter Roblox Group ID or Name"
                    disabled={isSearching}
                    autoFocus
                  />
                  {searchError && <div className="search-error">{searchError}</div>}
                </div>
                <div className="group-search-actions">
                  <button 
                    className="search-button"
                    onClick={handleSearch}
                    disabled={isSearching}
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                  <button 
                    className="cancel-button"
                    onClick={handleCancelAdd}
                    disabled={isSearching}
                  >
                    Cancel
                  </button>
                </div>
              </li>
            )}
            
            {!isAdding && (
              <li>
                <button 
                  className="add-group-button"
                  onClick={handleAddClick}
                >
                  <span className="add-icon">+</span>
                  <span>Add Group</span>
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default React.memo(GroupManager); 