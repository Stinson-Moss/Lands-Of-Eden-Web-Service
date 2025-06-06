import axios, { AxiosInstance } from 'axios'

const universeId = process.env.ROBLOX_UNIVERSE_ID;
const playerDatastore = process.env.ROBLOX_PLAYER_DATASTORE_NAME;
const groupDatastore = process.env.ROBLOX_GROUP_DATASTORE_NAME;
const groupApiKey = process.env.ROBLOX_GROUP_API_KEY;

class Store {
    private instance : AxiosInstance;
    private name : string;

    constructor(datastoreName : string) {
        this.name = datastoreName;
        this.instance = axios.create({
            baseURL: `https://apis.roblox.com/cloud/v2/universes/${universeId}/data-stores/${datastoreName}/entries/`,
            headers: {
                'x-api-key': groupApiKey,
                'Content-Type': 'application/json'
            }
        })
    }

    async GetEntry(key : string) {
        
        try {
            const response = await this.instance.get(key);

            if (response.status !== 200) {
                throw new Error(`Failed to get the entry, '${key}' from datastore '${this.name}'`)
            }

            
            const json = JSON.parse(response.data.value);
            console.log(json);
            
            return json;
        } catch (error) {
            console.log(error);
            throw new Error(`Error getting entry '${key}' from datastore '${this.name}'`);
        }
    }
    
    async ListEntries(maxPageSize : number, filter : string, showDeleted : boolean, token : string) {
        try {
            const response = await this.instance.get(``, {
                params: {
                    'maxPageSize': maxPageSize,
                    'filter': filter,
                    'showDeleted': showDeleted,
                    ...(token && { 'pageToken': token })
                }
            });

            if (response.status !== 200) {
                throw new Error(`Failed to list entries from datastore '${this.name}'`)
            }

            return response.data;
        } catch (error) {
            throw new Error(`Error listing entries from datastore '${this.name}'`);
        }
    }

    async UpdateEntry(key : string, value : any, allowMissing = true) {
        try {

            if (!('etag' in value) || !('value' in value)) {
                throw new Error(`Invalid entry value: '${value}'`)
            }

            const response = await this.instance.patch(key, {
                params: {
                    'allowMissing': allowMissing
                },
                data: value
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.status !== 200) {
                throw new Error(`Failed to update entry '${key}' in datastore '${this.name}'`);
            }
            
            return response.data;
        } catch (error) {
            throw new Error(`Error updating entry '${key}' in datastore '${this.name}'`);
        }
    }

    async DeleteEntry(key : string) {
        try {
            const response = await this.instance.delete(key);

            if (response.status !== 200) {
                throw new Error(`Failed to delete entry: '${key}' from datastore: ${this.name}`)
            }

            return response.data;            
        } catch (error) {
            throw error;
        }
    }

} 


class DatastoreServer {

    private static stores : {[key : string] : Store} = {};

    static GetDatastore(name : string) {
        if (this.stores[name]) {
            return this.stores[name];
        }

        const store = new Store(name);
        this.stores[name] = store;

        return store;
    }
}

export default DatastoreServer;
