// memorystore.ts
// Implements a memory-based storage system for caching or temporary data, supporting fast access and expiration logic.
import axios, { AxiosInstance } from 'axios'
import { groupCollapsed } from 'console';

const universeId = process.env.ROBLOX_UNIVERSE_ID;
const playerDatastore = process.env.ROBLOX_PLAYER_DATASTORE_NAME;
const groupDatastore = process.env.ROBLOX_GROUP_DATASTORE_NAME;
const groupApiKey = process.env.ROBLOX_GROUP_API_KEY;

enum Mode {
    PLAYER,
    GROUP
}

interface QueueItem {
    data : any;
    priority : number;
    ttl : number;
}

class MemoryStoreSortedMap {

    private instance : AxiosInstance;
    
    constructor(private mapName : string) {
        this.instance = axios.create({
            baseURL: `https://apis.roblox.com/cloud/v2/universes/${universeId}/memory-store/sorted-maps/${mapName}/`,
            headers: {
                'x-api-key': groupApiKey
            }
        })
    }

    async getItem(key : string) {
        const response = await this.instance.get(`/items/${key}`);
        return response.data?.value ?? null;
    }

    // async getItems() {

    // }

    async deleteItem(key : string) {
        const response = await this.instance.delete(`/items/${key}`);
        return response.data?.value ?? null;
    }

}

class MemoryStoreQueue {
    private instance : AxiosInstance;

    constructor(queueName : string) {
        this.instance = axios.create({
            baseURL: `https://apis.roblox.com/cloud/v2/universes/${universeId}/memory-store/queues/${queueName}/`,
            headers: {
                'x-api-key': groupApiKey
            }
        })
    }

    async push(item : QueueItem) {
        const response = await this.instance.post('/items', item);
        return response.data?.value ?? null;
    }

    async discard(readId : string) {
        const response = await this.instance.post(`/items:discard`, {
            readId: readId
        });
        
    }

    async read(count : number, allOrNothing : boolean = false, invisWindow : string = "30s") {
        const params = new URLSearchParams({
            count: count.toString(),
            allOrNothing: allOrNothing.toString(),
            invisibilityWindow: invisWindow
        })

        const response = await this.instance.post(`/items:read?${params}`);
        return response.data?.value ?? null;
    }
    
}


class MemoryStore {

    private static maps : {[key: string] : MemoryStoreSortedMap} = {};
    private static queues : {[key: string] : MemoryStoreQueue} = {};

    static GetSortedMap(mapName : string) {
        if (this.maps[mapName]) {
            return this.maps[mapName];
        }

        return new MemoryStoreSortedMap(mapName);
    }

    static GetQueue(queueName : string) {
        if (this.queues[queueName]) {
            return this.queues[queueName];
        }

        return new MemoryStoreQueue(queueName);
    }
}

export default MemoryStore;
