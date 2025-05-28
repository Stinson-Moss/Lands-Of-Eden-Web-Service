import React, { useState, useMemo } from 'react';
import './RankRoleBindings.css';
import Group from '../../types/Group';
import RankBinding, { ComparisonOperator } from '../../types/RankBinding';
import Server from '../../types/Server';

interface RankRoleBindingsProps {
  groups: Group[];
  bindings: RankBinding[];
  onAddBinding: (groupName: string, rank: number, roles: string[], operator: ComparisonOperator, secondaryRank?: number) => void;
  onRemoveBinding: (bindingId: string) => void;
  onUpdateBinding: (bindingId: string, rank: number, roles: string[], operator: ComparisonOperator, secondaryRank?: number) => void;
  isLoading: boolean;
  activeServer: Server | null;
}

// Comparison operators
const OPERATORS: { value: ComparisonOperator, label: string }[] = [
  { value: '=', label: 'Equal to (=)' },
  { value: '>=', label: 'Greater than or equal to (≥)' },
  { value: '<=', label: 'Less than or equal to (≤)' },
  { value: 'between', label: 'Between (inclusive)' }
];

const RankRoleBindings: React.FC<RankRoleBindingsProps> = ({
  groups,
  bindings,
  onAddBinding,
  onRemoveBinding,
  onUpdateBinding,
  isLoading,
  activeServer
}) => {
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [isAddingBinding, setIsAddingBinding] = useState<{[key: string]: boolean}>({});
  const [newBindingRank, setNewBindingRank] = useState<number>(0);
  const [newBindingSecondaryRank, setNewBindingSecondaryRank] = useState<number>(0);
  const [newBindingRoles, setNewBindingRoles] = useState<string[]>([]);
  const [newBindingOperator, setNewBindingOperator] = useState<ComparisonOperator>('=');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<string>('');
  
  // Filter groups based on search query
  const filteredGroups = useMemo(() => groups.filter(group => 
    group.Name.toLowerCase().includes(groupFilter.toLowerCase())
  ), [groups, groupFilter]);

  const handleAddBindingClick = (groupName: string) => {
    setIsAddingBinding({...isAddingBinding, [groupName]: true});
    setNewBindingRank(0);
    setNewBindingSecondaryRank(0);
    setNewBindingRoles([]);
    setNewBindingOperator('=');
    setValidationError(null);
  };

  const handleCancelAddBinding = (groupName: string) => {
    setIsAddingBinding({...isAddingBinding, [groupName]: false});
    setValidationError(null);
  };

  const handleSubmitAddBinding = (groupName: string) => {
    if (newBindingRank <= 0 || newBindingRoles.length === 0) {
      return;
    }
    
    // Validate between operator
    if (newBindingOperator === 'between') {
      if (newBindingSecondaryRank <= 0) {
        setValidationError('Please select a second rank for the between operator.');
        return;
      }
      
      if (newBindingRank === newBindingSecondaryRank) {
        setValidationError('Both ranks cannot be the same for the between operator.');
        return;
      }
      
      if (newBindingRank > newBindingSecondaryRank) {
        // Automatically swap the values to ensure valid range
        onAddBinding(groupName, newBindingSecondaryRank, newBindingRoles, newBindingOperator, newBindingRank);
      } else {
        onAddBinding(groupName, newBindingRank, newBindingRoles, newBindingOperator, newBindingSecondaryRank);
      }
    } else {
      onAddBinding(groupName, newBindingRank, newBindingRoles, newBindingOperator);
    }
    
    setIsAddingBinding({...isAddingBinding, [groupName]: false});
    setValidationError(null);
  };

  const handleRankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewBindingRank(Number(e.target.value));
  };

  const handleSecondaryRankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewBindingSecondaryRank(Number(e.target.value));
  };

  const handleOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewBindingOperator(e.target.value as ComparisonOperator);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const values: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        values.push(options[i].value);
      }
    }
    setNewBindingRoles(values);
  };

  const handleUpdateRank = (bindingId: string, roles: string[], operator: ComparisonOperator, secondaryRank: number | undefined, e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRank = Number(e.target.value);
    onUpdateBinding(bindingId, newRank, roles, operator, secondaryRank);
  };

  const handleUpdateSecondaryRank = (bindingId: string, rank: number, roles: string[], operator: ComparisonOperator, e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSecondaryRank = Number(e.target.value);
    
    // If the operator is "between", we need to validate the ranks
    if (operator === 'between' && newSecondaryRank > 0) {
      // If the first rank is higher than the second rank, swap them
      if (rank > newSecondaryRank) {
        onUpdateBinding(bindingId, newSecondaryRank, roles, operator, rank);
        return;
      }
    }
    
    onUpdateBinding(bindingId, rank, roles, operator, newSecondaryRank);
  };

  const handleUpdateOperator = (bindingId: string, rank: number, roles: string[], secondaryRank: number | undefined, e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOperator = e.target.value as ComparisonOperator;
    onUpdateBinding(bindingId, rank, roles, newOperator, secondaryRank);
  };

  const handleUpdateRoles = (bindingId: string, rank: number, operator: ComparisonOperator, secondaryRank: number | undefined, e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const values: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        values.push(options[i].value);
      }
    }
    onUpdateBinding(bindingId, rank, values, operator, secondaryRank);
  };

  // Helper function to check if a between binding has valid rank values
  const isValidBetweenBinding = (rank1: number, rank2: number) => {
    return rank1 > 0 && rank2 > 0 && rank1 !== rank2;
  };

  // Helper function to get a human-readable description of the binding
  const getBindingDescription = (rank: number, operator: ComparisonOperator, secondaryRank?: number) => {
    const rankName = activeGroup?.Ranks[rank.toString()] || rank;
    
    switch(operator) {
      case '=':
        return `Exactly ${rankName}`;
      case '>=':
        return `${rankName} or higher`;
      case '<=':
        return `${rankName} or lower`;
      case 'between':
        if (secondaryRank && isValidBetweenBinding(rank, secondaryRank)) {
          // Determine which rank is higher/lower
          const isRank1Lower = rank < secondaryRank;
          const lowerRank = isRank1Lower ? rank : secondaryRank;
          const higherRank = isRank1Lower ? secondaryRank : rank;
          
          const lowerRankName = activeGroup?.Ranks[lowerRank.toString()] || lowerRank;
          const higherRankName = activeGroup?.Ranks[higherRank.toString()] || higherRank;
          
          return `Between ${lowerRankName} and ${higherRankName} (inclusive)`;
        }
        
        if (secondaryRank && rank === secondaryRank) {
          return `⚠️ Both ranks are the same`;
        }
        
        if (secondaryRank && rank > secondaryRank) {
          const firstRankName = activeGroup?.Ranks[rank.toString()] || rank;
          const secondRankName = activeGroup?.Ranks[secondaryRank.toString()] || secondaryRank;
          return `⚠️ Error: First rank (${firstRankName}) is higher than second rank (${secondRankName})`;
        }
        
        return `Incomplete range configuration`;
      default:
        return `${rankName}`;
    }
  };

  if (isLoading) {
    return (
      <div className="bindings-loading">
        <div className="loading-placeholder"></div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="bindings-empty">
        <p>Add Roblox groups first to configure rank-role bindings.</p>
      </div>
    );
  }

  return (
    <div className="rank-role-bindings">
      {groups.length > 0 && (
        <div className="rank-bindings-filter">
          <div className="search-filter">
            <input
              type="text"
              placeholder="Search groups..."
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="search-input"
            />
            {groupFilter && (
              <button 
                className="clear-search" 
                onClick={() => setGroupFilter('')}
                aria-label="Clear filter"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}
      
      {filteredGroups.length > 0 && Object.values(bindings).length > 0 ? (
        filteredGroups.map(group => {
          const groupBindings = bindings.filter(binding => binding.groupName === group.Name);
          const isActive = activeGroup === group;
          return (
            <div 
              key={group.Name} 
              className={`binding-group ${isActive ? 'active' : ''}`}
            >
              <div 
                className="binding-group-header"
                onClick={() => setActiveGroup(isActive ? null : group)}
              >
                <div className="binding-group-info">
                  <div className="binding-group-thumbnail">
                    {group.Icon ? (
                      <img src={group.Icon} alt={`${group.Name} thumbnail`} />
                    ) : (
                      <div className="binding-group-thumbnail-placeholder"></div>
                    )}
                  </div>
                  <h3 className="binding-group-name">{group.Name}</h3>
                </div>
                <div className="binding-group-toggle">
                  <span className={`toggle-icon ${isActive ? 'open' : ''}`}>▼</span>
                </div>
              </div>
              
              <div className={`binding-group-content ${isActive ? 'open' : ''}`}>
                {groupBindings.length === 0 && !isAddingBinding[group.Name] ? (
                  <div className="no-bindings-message">
                    <p>No rank-role bindings for this group. Add your first binding below.</p>
                  </div>
                ) : (
                  <table className="bindings-table">
                    <thead>
                      <tr>
                        <th>Rank Condition</th>
                        <th>Discord Roles</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupBindings.map(binding => (
                        <tr key={binding.id} className="binding-row">
                          <td>
                            <div className="rank-condition">
                              <select 
                                className="operator-select"
                                value={binding.operator}
                                onChange={(e) => handleUpdateOperator(binding.id, binding.rank, binding.roles, binding.secondaryRank, e)}
                              >
                                {OPERATORS.map(op => (
                                  <option key={op.value} value={op.value}>
                                    {op.label}
                                  </option>
                                ))}
                              </select>
                              <select 
                                className="rank-select"
                                value={binding.rank}
                                onChange={(e) => handleUpdateRank(binding.id, binding.roles, binding.operator, binding.secondaryRank, e)}
                              >
                                <option value="">Select Rank</option>
                                {Object.entries(activeGroup?.Ranks || {}).map(([rank, name]) => (
                                  <option key={rank} value={rank}>
                                    {name}
                                  </option>
                                ))}
                              </select>
                              
                              {binding.operator === 'between' && (
                                <div className="secondary-rank-container">
                                  <span className="and-label">and</span>
                                  <select 
                                    className="rank-select secondary-rank"
                                    value={binding.secondaryRank || 0}
                                    onChange={(e) => handleUpdateSecondaryRank(binding.id, binding.rank, binding.roles, binding.operator, e)}
                                  >
                                    <option value="0">Select Rank</option>
                                    {Object.entries(activeGroup?.Ranks || {}).map(([rank, name]) => (
                                      <option key={rank} value={rank}>
                                        {name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                              
                              <div className="binding-description">
                                {getBindingDescription(binding.rank, binding.operator, binding.secondaryRank)}
                              </div>
                            </div>
                          </td>
                          <td>
                            <select 
                              className="roles-select"
                              multiple
                              value={binding.roles}
                              onChange={(e) => handleUpdateRoles(binding.id, binding.rank, binding.operator, binding.secondaryRank, e)}
                            >
                              {activeServer?.roles
                                .sort((a, b) => b.position - a.position)
                                .map(role => (
                                  <option 
                                    key={role.id} 
                                    value={role.id}
                                    style={{color: role.color}}
                                  >
                                    {role.name}
                                  </option>
                                ))}
                            </select>
                          </td>
                          <td>
                            <button 
                              className="remove-binding-button"
                              onClick={() => onRemoveBinding(binding.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      
                      {isAddingBinding[group.Name] && (
                        <tr className="new-binding-row">
                          <td>
                            <div className="rank-condition">
                              <select 
                                className="operator-select"
                                value={newBindingOperator}
                                onChange={handleOperatorChange}
                              >
                                {OPERATORS.map(op => (
                                  <option key={op.value} value={op.value}>
                                    {op.label}
                                  </option>
                                ))}
                              </select>
                              <select 
                                className="rank-select"
                                value={newBindingRank}
                                onChange={handleRankChange}
                              >
                                <option value="0">Select Rank</option>
                                {Object.entries(activeGroup?.Ranks || {}).map(([rank, name]) => (
                                  <option key={rank} value={rank}>
                                    {rank}. {name}
                                  </option>
                                ))}
                              </select>
                              
                              {newBindingOperator === 'between' && (
                                <div className="secondary-rank-container">
                                  <span className="and-label">and</span>
                                  <select 
                                    className="rank-select secondary-rank"
                                    value={newBindingSecondaryRank}
                                    onChange={handleSecondaryRankChange}
                                  >
                                    <option value="0">Select Rank</option>
                                    {Object.entries(activeGroup?.Ranks || {}).map(([rank, name]) => (
                                      <option key={rank} value={rank}>
                                        {rank}. {name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                              
                              {newBindingRank > 0 && (
                                <div className="binding-description">
                                  {getBindingDescription(
                                    newBindingRank, 
                                    newBindingOperator, 
                                    newBindingOperator === 'between' ? newBindingSecondaryRank : undefined
                                  )}
                                </div>
                              )}
                              
                              {validationError && (
                                <div className="binding-validation-error">
                                  {validationError}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <select 
                              className="roles-select"
                              multiple
                              value={newBindingRoles}
                              onChange={handleRoleChange}
                            >
                              {activeServer?.roles
                                .sort((a, b) => b.position - a.position)
                                .map(role => (
                                  <option 
                                    key={role.id} 
                                    value={role.id}
                                    style={{color: role.color}}
                                >
                                  {role.name}
                                </option>
                              ))}
                            </select>
                            <div className="roles-help">
                              Hold Ctrl/Cmd to select multiple roles
                            </div>
                          </td>
                          <td>
                            <div className="new-binding-actions">
                              <button 
                                className="add-binding-confirm-button"
                                onClick={() => handleSubmitAddBinding(group.Name)}
                                disabled={
                                  newBindingRank === 0 || 
                                  newBindingRoles.length === 0 || 
                                  (newBindingOperator === 'between' && newBindingSecondaryRank === 0)
                                }
                              >
                                Add
                              </button>
                              <button 
                                className="add-binding-cancel-button"
                                onClick={() => handleCancelAddBinding(group.Name)}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
                
                {!isAddingBinding[group.Name] && (
                  <button 
                    className="add-binding-button"
                    onClick={() => handleAddBindingClick(group.Name)}
                  >
                    <span className="add-icon">+</span>
                    <span>Add Binding</span>
                  </button>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="no-results">
          <p>No groups match your filter.</p>
          <button 
            className="clear-filter-button"
            onClick={() => setGroupFilter('')}
          >
            Clear Filter
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(RankRoleBindings); 