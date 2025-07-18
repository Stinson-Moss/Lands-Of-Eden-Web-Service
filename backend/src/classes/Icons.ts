// Icons.ts
// Exports icon assets or icon-related utilities for use in the backend, such as for embeds or UI representations.
const url = 'https://thumbnails.roblox.com/v1/assets/?assetIds=%s&format=webp&size=150x150';

class Icons {
    static cache: Map<string, string> = new Map();

    static async getGroupIcon(icon: string) {
        if (this.cache.has(icon)) {
            return this.cache.get(icon);
        }

        const iconId = icon.match(/\d+/)?.[0] || null;
        console.log('ICON ID:', iconId);

        if (!iconId) {
            return '';
        }

        try {
            const response = await fetch(url.replace('%s', iconId));
            const data = await response.json();
            const imageUrl = data.data[0].imageUrl;
            this.cache.set(icon, imageUrl);
            return imageUrl;
        } catch (error) {
            console.error('Error fetching group icon:', error);
            return '';
        }
    }
}

export default Icons;