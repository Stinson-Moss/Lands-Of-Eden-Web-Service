// Define the allowed comparison operators
export type ComparisonOperator = '=' | '>=' | '<=' | 'between';

interface RankBinding {
    id: string;
    serverId: string;
    groupName: string;
    rank: number;
    secondaryRank?: number; // Used for 'between' operator to specify the upper bound
    roles: string[];
    operator: ComparisonOperator; // = (equal), >= (greater than or equal), <= (less than or equal), between (between two ranks, inclusive)
}

export default RankBinding;