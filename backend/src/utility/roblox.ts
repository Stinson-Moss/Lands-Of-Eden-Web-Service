// roblox.ts
// Provides utility functions for interacting with the Roblox API, such as fetching user data or managing group roles.
import axios from 'axios';
import groups from '@data/groups.json';

const ROBLOX_API_KEY = process.env.ROBLOX_USER_API_KEY;

export async function updateGroupIcons() {
  const iconIds = Object.values(groups).map(group => group.Icon.match(/\d+/)?.[0] || '');
  const iconIdsString = iconIds.join(',');

  try {
    const response = await axios.get(`https://thumbnails.roblox.com/v1/assets/?assetIds=${iconIdsString}&size=150x150&format=Webp`, {
      headers: {
        'x-api-key': ROBLOX_API_KEY
      }
    });

    const data = response.data.data;
    for (const iconData of data) {
      for (const [name, group] of Object.entries(groups)) {
        if (iconData.targetId == group.Icon.match(/\d+/)?.[0]) {
          groups[name as keyof typeof groups].Icon = iconData.imageUrl;
        }
      }
    }
  } catch (error) {
    console.error('Error updating group icons:', error);
  }
} 

export async function getRobloxInfoWithKey(userid: number) {
  const userResponse = await axios.get(`https://apis.roblox.com/cloud/v2/users/${userid}`, {
    headers: {
      'x-api-key': ROBLOX_API_KEY!,
    },
  });

  const thumbnailResponse = await axios.get(`https://apis.roblox.com/cloud/v2/users/${userid}:generateThumbnail?size=60&format=PNG&shape=ROUND`,
    {
      headers: {
        'x-api-key': ROBLOX_API_KEY!,
      },
    }
  )

  return {
    user: userResponse.data,
    thumbnail: thumbnailResponse.data
  }
}