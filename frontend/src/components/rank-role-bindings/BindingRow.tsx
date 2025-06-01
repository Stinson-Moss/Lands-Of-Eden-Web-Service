import React from 'react';
import { BindingRowProps, OPERATORS } from './types';


const BindingRow: React.FC<BindingRowProps> = ({
  binding,
  onUpdateBinding,
  onRemoveBinding,
  activeServer,
  activeGroup
}) => {
  const handleUpdateRank = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRank = Number(e.target.value);
    onUpdateBinding(binding.id, newRank, binding.roles, binding.operator, binding.secondaryRank);
  };

  const handleUpdateSecondaryRank = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSecondaryRank = Number(e.target.value);
    
    if (binding.operator === 'between' && newSecondaryRank > 0) {
      if (binding.rank > newSecondaryRank) {
        onUpdateBinding(binding.id, newSecondaryRank, binding.roles, binding.operator, binding.rank);
        return;
      }
    }
    
    onUpdateBinding(binding.id, binding.rank, binding.roles, binding.operator, newSecondaryRank);
  };

  const handleUpdateOperator = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOperator = e.target.value as ComparisonOperator;
    onUpdateBinding(binding.id, binding.rank, binding.roles, newOperator, binding.secondaryRank);
  };

  const handleUpdateRoles = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const values: string[] = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        values.push(options[i].value);
      }
    }    

    onUpdateBinding(binding.id, binding.rank, values, binding.operator, binding.secondaryRank);
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
    <tr className="binding-row">
      <td>
        <div className="rank-condition">
          <select 
            className="operator-select"
            value={binding.operator}
            onChange={handleUpdateOperator}
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
            onChange={handleUpdateRank}
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
                onChange={handleUpdateSecondaryRank}
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
          onChange={handleUpdateRoles}
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
  );
};

export default React.memo(BindingRow); 