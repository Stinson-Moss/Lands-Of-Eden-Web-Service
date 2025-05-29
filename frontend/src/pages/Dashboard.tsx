import React, { useState, useEffect } from 'react';
import ServerSelector from '../components/dashboard/ServerSelector';
import GroupManager from '../components/dashboard/GroupManager';
import RankRoleBindings from '../components/dashboard/RankRoleBindings';
import SaveChangesBar from '../components/dashboard/SaveChangesBar';
import NegativeConfirmationDialog from '../components/NegativeConfirmationDialog';
import { User } from '../types/Session';
import Server from '../types/Server';
import Group from '../types/Group';
import RankBinding, { ComparisonOperator } from '../types/RankBinding';
import './Dashboard.css';
const BACKEND_URL = process.env.REACT_APP_BACKEND_LINK || '';

interface DashboardProps {
  user: User | null;
}

const groupList: {[key: string]: Group} = {};

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  // State for servers, selected server, groups, and bindings
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [bindings, setBindings] = useState<RankBinding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [requestedServer, setRequestedServer] = useState<Server | null>(null);

  // Get the servers
  useEffect(() => {
    const fetchServers = async () => {
      setIsLoading(true);
      try {

        // TODO: CSRF protection
        const serverResponse = await fetch(`${BACKEND_URL}/api/servers`, {
          credentials: 'include'
        });
        const mutualServers = await serverResponse.json();

        setServers(mutualServers.guilds);
        setSelectedServer(mutualServers.guilds[0]);
      } catch (error) {
        console.error('Error fetching servers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServers();
  }, []);

  // Fetch groups and bindings when selected server changes
  useEffect(() => {
    if (!selectedServer) return;

    const fetchGroupsAndBindings = async () => {
      setIsLoading(true);
      try {
        // TODO: CSRF protection
        // Get binding settings for selected server
        const bindingsResponse = await fetch(`${BACKEND_URL}/api/bindings/${selectedServer.id}`, {
          method: 'GET',
          credentials: 'include'
        });
        const bindingsData = await bindingsResponse.json();

        // Bindings are separated by group name, so we need to get the group data from each binding key
        const fetchedGroups: Group[] = [];

        for (const groupName of Object.keys(bindingsData)) {
          if (groupList[groupName]) {
            fetchedGroups.push(groupList[groupName]);
          } else {

            try {
              const groupResponse = await fetch(`${BACKEND_URL}/api/group/${groupName}`, {
                credentials: 'include'
              });
              const groupData = await groupResponse.json();
              groupList[groupName] = groupData;
              fetchedGroups.push(groupData);
            } catch (error) {
              console.error('Error fetching group:', error);
            }
          }
        }
 
        console.log(bindingsData);
        setGroups(fetchedGroups);
        setBindings(bindingsData);
      } catch (error) {
        console.error('Error fetching groups and bindings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupsAndBindings();
  }, [selectedServer]);

  // Handle server selection
  const handleServerSelect = (server: Server) => {
    if (hasChanges) {
      setRequestedServer(server);
    } else {
      setSelectedServer(server);
    }
  };

  // Handle group addition
  const handleAddGroup = async (group : Group) => {

    setGroups([...groups, group]);
    setHasChanges(true);
  };

  // Handle group removal
  const handleRemoveGroup = (targetGroup: Group) => {
    setGroups(groups.filter(group => group.Name !== targetGroup.Name));

    if (Object.keys(bindings).length > 0) {
      setBindings(bindings.filter(binding => binding.groupName !== targetGroup.Name));
    }

    setHasChanges(true);
  };

  // Handle binding addition
  const handleAddBinding = (groupName: string, rank: number, roles: string[], operator: ComparisonOperator, secondaryRank?: number) => {
    const newBinding = {
      id: `b${Date.now()}`,
      groupName,
      rank,
      roles,
      operator,
      secondaryRank
    };
    setBindings([...bindings, newBinding]);
    setHasChanges(true);
  };

  // Handle binding removal
  const handleRemoveBinding = (bindingId: string) => {
    setBindings(bindings.filter(binding => binding.id !== bindingId));
    setHasChanges(true);
  };

  // Handle binding update
  const handleUpdateBinding = (bindingId: string, rank: number, roles: string[], operator: ComparisonOperator, secondaryRank?: number) => {
    setBindings(bindings.map(binding => 
      binding.id === bindingId ? { ...binding, rank, roles, operator, secondaryRank } : binding
    ));
    setHasChanges(true);
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      
      await fetch(`${BACKEND_URL}/api/bindings/${selectedServer?.id}`, {
        method: 'POST',
        body: JSON.stringify(bindings),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="dashboard-container">
      {requestedServer && (
        <NegativeConfirmationDialog
          cardInfo={{
            title: 'Unsaved Changes',
            question: 'You have unsaved changes. Are you sure you want to switch servers?',
            confirmButtonText: 'Switch Server',
            cancelButtonText: 'Cancel'
          }}
          onConfirm={() => {
            setSelectedServer(requestedServer);
            setRequestedServer(null);
          }}
          onCancel={() => setRequestedServer(null)}
        />
      )}
      <div className="dashboard-content">
        <h1 className="dashboard-title">Role-Bindings</h1>
        
        <section className="server-selection-section">
          <h2>Server Selection</h2>
          <ServerSelector
            servers={servers}
            selectedServer={selectedServer}
            onSelectServer={handleServerSelect}
            isLoading={isLoading}
          />
        </section>
        
        <section className="group-management-section">
          <h2>Group Management</h2>
          <GroupManager
            groups={groups}
            onAddGroup={handleAddGroup}
            onRemoveGroup={handleRemoveGroup}
            isLoading={isLoading}
          />
        </section>
        
        <section className="rank-role-bindings-section">
          <h2>Rank-Role Bindings</h2>
          <RankRoleBindings
            groups={groups}
            bindings={bindings}
            onAddBinding={handleAddBinding}
            onRemoveBinding={handleRemoveBinding}
            onUpdateBinding={handleUpdateBinding}
            isLoading={isLoading}
            activeServer={selectedServer}
          />
        </section>
      </div>
      
      <SaveChangesBar
        hasChanges={hasChanges}
        isSaving={isSaving}
        onSaveChanges={handleSaveChanges}
      />
    </div>
  );
};

export default Dashboard; 