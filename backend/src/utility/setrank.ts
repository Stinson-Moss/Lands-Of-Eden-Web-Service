import PlayerData from "@utility/playerData";
import Datastore from "@/classes/datastore";
import axios from "axios";

interface RobloxUser {
    robloxId: string;
    data: PlayerData;
}

const url = `https://apis.roblox.com/cloud/v2/universes/${process.env.ROBLOX_UNIVERSE_ID}/memory-store/sorted-maps/Players/items/`;

async function isInGame(userId: string) : Promise<number | null> {
    try {
        const response = await axios.get(`${url}${userId}`, {
            headers: {
                "x-api-key": process.env.ROBLOX_GROUP_API_KEY
            }
        });

        return response.data?.value ?? null;
    } catch (error) {
        return null;
    }
}

export default async function setRank(setter: RobloxUser, user: RobloxUser, group: string, targetRank: number) {
    const placeId = await isInGame(user.robloxId);
    
    if (placeId) {
        // use memory queue
        const queueUrl = `https://apis.roblox.com/cloud/v2/universes/${process.env.ROBLOX_UNIVERSE_ID}/memory-store/queues/PlayerActions_${placeId}/items/`;

        const response = await axios.post(queueUrl, {
            action: "SetRank",
            userId: user.robloxId,
            group: group,
            targetRank: targetRank
        }, {
            headers: {
                "x-api-key": process.env.ROBLOX_GROUP_API_KEY
            }
        });

        return response.data;
    } else {
        // update the datastore
        user.data.Ranks[group as keyof typeof user.data.Ranks] = targetRank;
        const result = await Datastore.UpdateEntry(user.robloxId, user.data);

        return result;
    }
}