// canrankuser.ts
// Utility to determine if a user has permission to rank another user within a group, based on roles or other criteria.
import Groups from "@data/groups.json"

export default function canRankUser(setterRank: number, userRank: number, group: string, targetRank: number) {
    const groupData = Groups[group as keyof typeof Groups];

    return setterRank > userRank
        && setterRank >= groupData.Classes.Officer
        && targetRank < setterRank;
}