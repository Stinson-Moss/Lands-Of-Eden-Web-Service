import React, { useState, useMemo } from 'react';
import { RankRoleBindingsProps } from './types';
import BindingGroup from './BindingGroup';
import Group from '../../types/Group';
import './RankRoleBindings.css';

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
  const [groupFilter, setGroupFilter] = useState<string>('');
  
  // Filter groups based on search query
  const filteredGroups = useMemo(() => groups.filter(group => 
    group.Name.toLowerCase().includes(groupFilter.toLowerCase())
  ), [groups, groupFilter]);

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
        <p>Add groups first to configure rank-role bindings.</p>
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
      
      {filteredGroups.length > 0 ? (
        filteredGroups.map(group => {
          const groupBindings = bindings.filter(binding => binding.groupName === group.Name);
          const isActive = activeGroup === group;
          
          return (
            <BindingGroup
              key={group.Name}
              group={group}
              bindings={groupBindings}
              isActive={isActive}
              onToggleActive={() => setActiveGroup(isActive ? null : group)}
              onAddBinding={onAddBinding}
              onRemoveBinding={onRemoveBinding}
              onUpdateBinding={onUpdateBinding}
              activeServer={activeServer}
              activeGroup={activeGroup}
            />
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