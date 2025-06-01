import React, { useState } from 'react';
import { NewBindingRowProps, OPERATORS } from './types';

const NewBindingRow: React.FC<NewBindingRowProps> = ({
  groupName,
  onAddBinding,
  onCancel,
  activeServer,
  activeGroup
}) => {
  const [rank, setRank] = useState<number>(0);
  const [secondaryRank, setSecondaryRank] = useState<number>(0);
  const [roles, setRoles] = useState<string[]>([]);
  const [operator, setOperator] = useState<ComparisonOperator>('=');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (rank <= 0 || roles.length === 0) {
      return;
    }
    
    if (operator === 'between') {
      if (secondaryRank <= 0) {
        setValidationError('Please select a second rank for the between operator.');
        return;
      }
      
      if (rank === secondaryRank) {
        setValidationError('Both ranks cannot be the same for the between operator.');
        return;
      }
      
      if (rank > secondaryRank) {
        onAddBinding(groupName, secondaryRank, roles, operator, rank);
      } else {
        onAddBinding(groupName, rank, roles, operator, secondaryRank);
      }
    } else {
      onAddBinding(groupName, rank, roles, operator);
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const values: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        values.push(options[i].value);
      }
    }
    setRoles(values);
  };

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
        if (secondaryRank && rank !== secondaryRank) {
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

  return (
    <tr className="new-binding-row">
      <td>
        <div className="rank-condition">
          <select 
            className="operator-select"
            value={operator}
            onChange={(e) => setOperator(e.target.value as ComparisonOperator)}
          >
            {OPERATORS.map(op => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
          <select 
            className="rank-select"
            value={rank}
            onChange={(e) => setRank(Number(e.target.value))}
          >
            <option value="0">Select Rank</option>
            {Object.entries(activeGroup?.Ranks || {}).map(([rank, name]) => (
              <option key={rank} value={rank}>
                {rank}. {name}
              </option>
            ))}
          </select>
          
          {operator === 'between' && (
            <div className="secondary-rank-container">
              <span className="and-label">and</span>
              <select 
                className="rank-select secondary-rank"
                value={secondaryRank}
                onChange={(e) => setSecondaryRank(Number(e.target.value))}
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
          
          {rank > 0 && (
            <div className="binding-description">
              {getBindingDescription(
                rank, 
                operator, 
                operator === 'between' ? secondaryRank : undefined
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
          value={roles}
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
            onClick={handleSubmit}
            disabled={
              rank === 0 || 
              roles.length === 0 || 
              (operator === 'between' && secondaryRank === 0)
            }
          >
            Add
          </button>
          <button 
            className="add-binding-cancel-button"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
};

export default React.memo(NewBindingRow); 