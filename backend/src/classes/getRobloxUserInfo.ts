// getRobloxUserInfo.ts
// Contains functions to fetch and process Roblox user information, typically used for account linking and verification.
import Database from "./database";
import DatastoreServer from './datastore';
import axios from 'axios';
import Groups from "@data/groups.json";

interface UserInfo {
    username: string;
    displayName: string;
    avatar: string;
    id: string;
    groups: string[];
    discordId: string;
}

enum UserIdType {
    Discord = 1,
    Roblox = 2
}

const playerStore = DatastoreServer.GetDatastore("PlayerDataManager");

async function getUserInfo(userId: string, type: UserIdType): Promise<UserInfo> {

    let row = null;
    if (type === UserIdType.Discord) {
        row = await Database.getUserByDiscord(userId);
    } else if (type === UserIdType.Roblox) {
        row = await Database.getUserByRoblox(userId);
    }

    if (!row) {
        throw new Error("User not found");
    }

    const robloxId = row.robloxId;
    const discordId = row.discordId;

    const response = await fetch(`https://apis.roblox.com/cloud/v2/users/${robloxId}`, {
        headers: {
            'x-api-key': process.env.ROBLOX_USER_API_KEY as string
        },
    });
    const data = await response.json();

    const thumbnailData = await fetch(`https://apis.roblox.com/cloud/v2/users/${robloxId}:generateThumbnail?size=100&format=PNG&shape=ROUND`, {
        headers: {
            'x-api-key': process.env.ROBLOX_USER_API_KEY as string
        },
    });

    // thumbnail
    const thumbnail = await thumbnailData.json();
    let imageUri = thumbnail.response.imageUri;
    let poll = null;

    while (!thumbnail.done) {
        await new Promise(resolve => setTimeout(resolve, 500));
        poll = await fetch(`https://apis.roblox.com/cloud/v2/${thumbnail.path}`, {
            method: 'GET',
            headers: {
                'x-api-key': process.env.ROBLOX_USER_API_KEY as string
            },
        });
        
        poll = await poll.json();
        imageUri = poll.imageUri;
    }

    // groups
    const playerData = await playerStore?.GetEntry(robloxId as string);

    if (!playerData) {
        throw new Error("Player data not found");
    }


    const groups = Object.entries(playerData.Persistent.Ranks)
        .filter(([groupName, rank]) => {
            const group = Groups[groupName as keyof typeof Groups];
            return group && (rank as number) > 0 && !group.IsHidden;
        })
        .map(([groupName]) => groupName);
    
    return {
        username: data.name,
        displayName: data.displayName,
        avatar: imageUri,
        id: data.id,
        groups: groups,
        discordId: discordId
    }
}

async function getRobloxInfoWithKey(userid: number) {
    const userResponse = await axios.get(`https://apis.roblox.com/cloud/v2/users/${userid}`, {
      headers: {
        'x-api-key': process.env.ROBLOX_USER_API_KEY as string,
      },
    });
  
    const thumbnailResponse = await axios.get(`https://apis.roblox.com/cloud/v2/users/${userid}:generateThumbnail?size=60&format=PNG&shape=ROUND`,
      {
        headers: {
          'x-api-key': process.env.ROBLOX_USER_API_KEY as string,
        },
      }
    )
  
    return {
      user: userResponse.data,
      thumbnail: thumbnailResponse.data
    }
  }

export { getUserInfo, getRobloxInfoWithKey, UserInfo, UserIdType };
