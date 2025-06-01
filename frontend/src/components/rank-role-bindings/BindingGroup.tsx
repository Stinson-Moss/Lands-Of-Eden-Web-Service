import React, { useState } from 'react';
import { BindingGroupProps } from './types';
import BindingRow from './BindingRow';
import NewBindingRow from './NewBindingRow';

const BindingGroup: React.FC<BindingGroupProps> = ({
  group,
  bindings,
  isActive,
  onToggleActive,
  onAddBinding,
  onRemoveBinding,
  onUpdateBinding,
  activeServer,
  activeGroup
}) => {
  const [isAddingBinding, setIsAddingBinding] = useState(false);

  const handleAddBindingClick = () => {
    setIsAddingBinding(true);
  };

  const handleCancelAddBinding = () => {
    setIsAddingBinding(false);
  };

  return (
    <div 
      className={`binding-group ${isActive ? 'active' : ''}`}
    >
      <div 
        className="binding-group-header"
        onClick={onToggleActive}
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
        {bindings.length === 0 && !isAddingBinding ? (
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
              {bindings.map(binding => (
                <BindingRow
                  key={binding.id}
                  binding={binding}
                  onUpdateBinding={onUpdateBinding}
                  onRemoveBinding={onRemoveBinding}
                  activeServer={activeServer}
                  activeGroup={activeGroup}
                />
              ))}
              
              {isAddingBinding && (
                <NewBindingRow
                  groupName={group.Name}
                  onAddBinding={onAddBinding}
                  onCancel={handleCancelAddBinding}
                  activeServer={activeServer}
                  activeGroup={activeGroup}
                />
              )}
            </tbody>
          </table>
        )}
        
        {!isAddingBinding && (
          <button 
            className="add-binding-button"
            onClick={handleAddBindingClick}
          >
            <span className="add-icon">+</span>
            <span>Add Binding</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(BindingGroup); 