import axios from 'axios'

const universeId = process.env.ROBLOX_UNIVERSE_ID;
const playerDatastore = process.env.ROBLOX_PLAYER_DATASTORE_NAME;
const groupDatastore = process.env.ROBLOX_GROUP_DATASTORE_NAME;
const groupApiKey = process.env.ROBLOX_GROUP_API_KEY;

enum Mode {
    PLAYER,
    GROUP
}

function datastore(mode : Mode) {
    switch (mode) {
        case Mode.PLAYER:
            return `${playerDatastore}/entries`;
        case Mode.GROUP:
            return `${groupDatastore}/entries`;
    }
}


class Datastore {

    static instance = axios.create({
        baseURL: `https://apis.roblox.com/cloud/v2/universes/${universeId}/data-stores/`,
        headers: {
            'x-api-key': groupApiKey
        }
    })

    static mode : Mode = Mode.PLAYER;
    
    static async GetEntry(key : string) {
        
        try {
            const response = await this.instance.get(`${datastore(this.mode)}/${key}`)

            if (response.status !== 200) {
                throw new Error(`Failed to get the entry, '${key}' from datastore '${playerDatastore}'`)
            }

            
            const json = JSON.parse(response.data.value);
            console.log(json);
            
            return json;
        } catch (error) {
            console.log(error);
            throw new Error(`Error getting entry '${key}' from datastore '${playerDatastore}'`);
        }
    }
    
    static async ListEntries(maxPageSize : number, filter : string, showDeleted : boolean, token : string) {
        try {
            const response = await this.instance.get(`${datastore(this.mode)}`, {
                params: {
                    'maxPageSize': maxPageSize,
                    'filter': filter,
                    'showDeleted': showDeleted,
                    ...(token && { 'pageToken': token })
                }
            });

            if (response.status !== 200) {
                throw new Error(`Failed to list entries from datastore '${datastore(this.mode)}'`)
            }

            return response.data;
        } catch (error) {
            throw new Error(`Error listing entries from datastore '${datastore(this.mode)}'`);
        }
    }

    static async UpdateEntry(key : string, value : any, allowMissing = true) {
        try {

            if (!('etag' in value) || !('value' in value) || !('users' in value)) {
                throw new Error(`Invalid entry value: '${value}'`)
            }

            const response = await this.instance.patch(`${datastore(this.mode)}/${key}`, {
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
                throw new Error(`Failed to update entry '${key}' in datastore '${datastore(this.mode)}'`);
            }
            
            return response.data;
        } catch (error) {
            throw new Error(`Error updating entry '${key}' in datastore '${datastore(this.mode)}'`);
        }
    }


    static async DeleteEntry(key : string) {
        try {
            const response = await this.instance.delete(`${datastore(this.mode)}/${key}`);

            if (response.status !== 200) {
                throw new Error(`Failed to delete entry: '${key}' from datastore: ${datastore(this.mode)}`)
            }

            return response.data;            
        } catch (error) {
            throw error;
        }
    }
}

export default Datastore;
