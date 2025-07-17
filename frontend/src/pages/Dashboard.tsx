import React, { useState, useEffect } from 'react';
import ServerSelector from '../components/dashboard/ServerSelector';
import GroupManager from '../components/dashboard/GroupManager';
import RankRoleBindings from '../components/rank-role-bindings/RankRoleBindings';
import SaveChangesBar from '../components/dashboard/SaveChangesBar';
import NegativeConfirmationDialog from '../components/NegativeConfirmationDialog';
import { User } from '../types/Session';
import Server from '../types/Server';
import Group from '../types/Group';
import RankBinding, { ComparisonOperator } from '../types/RankBinding';
import './Dashboard.css';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_LINK || '';

interface DashboardProps {
  user: User | null;
}

const groupList: {[key: string]: Group} = {};
const deletedBindings: (string | number)[] = [];

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
  
  if (!isLoading && (!user?.discord || !user.discord.id)) {
    window.location.href = '/';
  }
  
  // Get the servers
  useEffect(() => {
    const fetchServers = async () => {
      setIsLoading(true);
      try {

        // TODO: CSRF protection
        const serverResponse = await axios.get(`${BACKEND_URL}/servers`, {
          withCredentials: true
        });
        const mutualServers = serverResponse.data;

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
        const bindingsResponse = await axios.get(`${BACKEND_URL}/bindings/${selectedServer.id}`, {
          withCredentials: true
        });
        const bindingsData: RankBinding[] = bindingsResponse.data;
        const fetchedGroups: Group[] = [];

        for (const groupBinding of bindingsData) {
          if (groupList[groupBinding.groupName]) {
            if (!fetchedGroups.find(group => group.Name === groupBinding.groupName)) {
              fetchedGroups.push(groupList[groupBinding.groupName]);
            }
          } else {
            try {
              const groupResponse = await axios.get(`${BACKEND_URL}/groups/find/${groupBinding.groupName}`, {
                withCredentials: true
              });
              const groupData = groupResponse.data;
              groupList[groupBinding.groupName] = groupData;
              fetchedGroups.push(groupData);
            } catch (error) {
              console.error('Error fetching group:', error);
            }
          }
        }

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
    setBindings(bindings.filter(binding => binding.groupName !== targetGroup.Name));
    setHasChanges(true);
  };

  // Handle binding addition
  const handleAddBinding = (groupName: string, rank: number, roles: string[], operator: ComparisonOperator, secondaryRank?: number) => {
    const newBinding = {
      id: crypto.randomUUID(),
      serverId: selectedServer?.id || '',
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
  const handleRemoveBinding = (bindingId: string | number) => {
    if (deletedBindings.includes(bindingId)) {
      return;
    }

    if (bindings.some(binding => binding.id === bindingId)) {
      if (typeof bindingId === 'number') {
        deletedBindings.push(bindingId.toString());
      }
      
      setBindings(bindings.filter(binding => binding.id !== bindingId));
      setHasChanges(true);
    }
  };

  // Handle binding update
  const handleUpdateBinding = (bindingId: string | number, rank: number, roles: string[], operator: ComparisonOperator, secondaryRank?: number) => {
    console.log("New roles", roles);
    setBindings(bindings.map(binding => 
      binding.id === bindingId ? { 
        groupName: binding.groupName,
        serverId: binding.serverId, 
        id: bindingId, 
        rank: rank, 
        roles: roles, 
        operator: operator, 
        secondaryRank: secondaryRank 
      } : binding
    ));
    setHasChanges(true);
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // TODO: CSRF protection
      const bindingRequest = {
        insert: [] as RankBinding[],
        update: [] as RankBinding[],
        delete: deletedBindings
      }

      for (const binding of bindings) {
        if (typeof binding.id === 'number') {
          bindingRequest.update.push(binding);
        } else {
          bindingRequest.insert.push(binding);
        }
      }

      const newBindingsResponse = await axios.post(`${BACKEND_URL}/bindings/${selectedServer?.id}`, JSON.stringify(bindingRequest), {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      const bindingList = newBindingsResponse.data;
      for (const [oldId, newId] of Object.entries(bindingList)) {
        const binding = bindings.find(binding => binding.id === oldId);

        if (binding) {
          binding.id = newId as string;
        }
      }

      deletedBindings.length = 0;

      setBindings([...bindings]);      
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
            deletedBindings.length = 0;
            setSelectedServer(requestedServer);
            setRequestedServer(null);
          }}
          onCancel={() => {
            deletedBindings.length = 0;
            setRequestedServer(null);
          }}
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