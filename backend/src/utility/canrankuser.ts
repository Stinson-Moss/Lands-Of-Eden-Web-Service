// Admin command: Update Tester roles
import Groups from "@data/groups.json"

export default function canRankUser(setterRank: number, userRank: number, group: string, targetRank: number) {
    const groupData = Groups[group as keyof typeof Groups];

    return setterRank > userRank
        && setterRank >= groupData.Classes.Officer
        && targetRank < setterRank;
}