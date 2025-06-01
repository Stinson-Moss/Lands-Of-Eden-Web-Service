import Group from '../../../types/Group';
import RankBinding, { ComparisonOperator } from '../../../types/RankBinding';
import Server from '../../../types/Server';

export interface RankRoleBindingsProps {
  groups: Group[];
  bindings: RankBinding[];
  onAddBinding: (groupName: string, rank: number, roles: string[], operator: ComparisonOperator, secondaryRank?: number) => void;
  onRemoveBinding: (bindingId: string) => void;
  onUpdateBinding: (bindingId: string, rank: number, roles: string[], operator: ComparisonOperator, secondaryRank?: number) => void;
  isLoading: boolean;
  activeServer: Server | null;
}

export interface BindingGroupProps {
  group: Group;
  bindings: RankBinding[];
  isActive: boolean;
  onToggleActive: () => void;
  onAddBinding: (groupName: string, rank: number, roles: string[], operator: ComparisonOperator, secondaryRank?: number) => void;
  onRemoveBinding: (bindingId: string) => void;
  onUpdateBinding: (bindingId: string, rank: number, roles: string[], operator: ComparisonOperator, secondaryRank?: number) => void;
  activeServer: Server | null;
  activeGroup: Group | null;
}

export interface BindingRowProps {
  binding: RankBinding;
  onUpdateBinding: (bindingId: string, rank: number, roles: string[], operator: ComparisonOperator, secondaryRank?: number) => void;
  onRemoveBinding: (bindingId: string) => void;
  activeServer: Server | null;
  activeGroup: Group | null;
}

export interface NewBindingRowProps {
  groupName: string;
  onAddBinding: (groupName: string, rank: number, roles: string[], operator: ComparisonOperator, secondaryRank?: number) => void;
  onCancel: () => void;
  activeServer: Server | null;
  activeGroup: Group | null;
}

export const OPERATORS: { value: ComparisonOperator, label: string }[] = [
  { value: '=', label: 'Equal to (=)' },
  { value: '>=', label: 'Greater than or equal to (≥)' },
  { value: '<=', label: 'Less than or equal to (≤)' },
  { value: 'between', label: 'Between (inclusive)' }
]; 