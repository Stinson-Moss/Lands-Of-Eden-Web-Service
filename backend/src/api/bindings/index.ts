import { Router } from 'express';
import { PermissionsBitField } from 'discord.js';
import { verifySession } from '@utility/session';
import { COOKIE_EXPIRATION } from '@utility/constants';
import { and, eq, inArray, sql } from 'drizzle-orm';
import DiscordClient from '@classes/discordclient';
import Database from '@classes/database';
import groups from '@data/groups.json';
interface rankBinding {
  groupName: string;
  rank: number;
  operator: string;
  secondaryRank?: number;
  roles: string[];
  id: string | null;
}

const router = Router();

router.get('/:serverId', async (req, res) => {
    const session = req.cookies.session;
    const sessionResponse = await verifySession(session, null);
  
    if (!sessionResponse.verified) {
      return res.status(401).json({ error: 'Invalid session' });
    }
  
    const serverId = req.params.serverId;
    if (!serverId) {
      return res.status(400).json({ error: 'No server ID provided' });
    }
  
    try {
      const result = await Database.select().from(Database.bindings).where(eq(Database.bindings.serverId, serverId));

      if (result.length === 0) {
        return res.status(200).json([]);
      }
  
      if (sessionResponse.needsUpdate) {
        Database.update(Database.users).set({
          token: sessionResponse.data.token,
          refreshToken: sessionResponse.data.refreshToken,
          tokenExpires: sessionResponse.data.expiresIn
        }).where(eq(Database.users.token, session));
    
        res.cookie('session', JSON.stringify({token: sessionResponse.data.token, refreshToken: sessionResponse.data.refreshToken}), {
          httpOnly: true,
          secure: true,
          maxAge: COOKIE_EXPIRATION,
          sameSite: 'none',
        });
      }
    
      res.json(result);
    } catch (error) {
        console.error('Error fetching bindings:', error);
        return res.status(500).json({ error: 'Failed to fetch bindings' });
    }
})

router.post('/:serverId', async (req, res) => {
    const session = req.cookies.session;
  
    const result = await Database.select().from(Database.users).where(eq(Database.users.token, JSON.parse(session).token));
    const queryObject = result[0];
  
    if (!queryObject) {
      return res.status(401).json({ error: 'Invalid session' });
    }
  
    const sessionResponse = await verifySession(session, queryObject);
    
    if (!sessionResponse.verified) {
      return res.status(401).json({ error: 'Invalid session' });
    }
  
    const serverId = req.params.serverId;
    
    const guild = DiscordClient.client.guilds.cache.get(serverId);

    if (!guild) {
      return res.status(404).json({ error: 'Server not found' });
    }
  
    const discordMember = guild.members.cache.get(queryObject.discordId) ?? await guild.members.fetch(queryObject.discordId);

    if (!discordMember || !discordMember.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return res.status(403).json({ error: 'Invalid permissions' });
    }

    if (!req.body) {
      return res.status(400).json({ error: 'No body provided' });
    }
  
    // check if the server exists
    if (!DiscordClient.client.guilds.cache.get(serverId)) {
      return res.status(404).json({ error: 'Server not found' });
    }
  
    const bindingRequest : {insert: rankBinding[], delete: string[], update: rankBinding[]} = req.body;
    // binding length validation
    if (bindingRequest.insert.length === 0 && bindingRequest.delete.length === 0 && bindingRequest.update.length === 0) {
      return res.status(400).json({ error: 'No bindings provided' });
    }
  
    for (const bindings of [bindingRequest.insert, bindingRequest.update]) {
    
      if (bindings.length > 25) {
        return res.status(400).json({ error: 'Too many bindings provided' });
      }
    
      // check if the bindings are valid
      for (const binding of bindings) {
        const groupName = binding.groupName;
        const group = groups[groupName as keyof typeof groups];
    
        if (!group) {
          return res.status(404).json({ error: 'Group not found' });
        }
    
        // Binding validation
        if (!groupName || !binding.roles || !binding.rank || !binding.operator) {
          return res.status(400).json({ error: 'Invalid binding' });
        }
    
        // Operator validation
        if (binding.operator !== '>=' && binding.operator !== '<=' && binding.operator !== '=' && binding.operator !== 'between') {
          return res.status(400).json({ error: 'Invalid operator' });
        }
        
        if (binding.operator === 'between') {
          if (!binding.secondaryRank) {
            return res.status(400).json({ error: 'Secondary rank is required for between operator' });
          }
    
          if (binding.secondaryRank <= binding.rank) {
            return res.status(400).json({ error: 'Secondary rank must be greater than primary rank' });
          }
        } else {
          
          if (binding.secondaryRank) {
            return res.status(400).json({ error: 'Secondary rank is only allowed for between operator' });
          }
        }
    
        if (binding.secondaryRank && (isNaN(binding.secondaryRank!) || typeof binding.secondaryRank !== 'number')) {
          return res.status(400).json({ error: 'Invalid secondary rank' });
        }
    
        if (isNaN(binding.rank) || typeof binding.rank !== 'number') {
          return res.status(400).json({ error: 'Invalid rank' });
        }
    
        const groupRankCount = Object.keys(group.Ranks).length;
        if (binding.rank > groupRankCount || binding.secondaryRank! > groupRankCount || binding.rank < 0 || binding.secondaryRank! < 1) {
          return res.status(400).json({ error: 'Invalid rank' });
        }

        // binding id must be a number, any strings sent will be discarded
        if (binding.id && !binding.id.match(/^[0-9]+$/)?.[0]) {
          binding.id = null;
        }

        console.log('ID:', binding.id, binding.id?.match(/^[0-9]+$/)?.[0])
    
        // check roles
        const guild = DiscordClient.client.guilds.cache.get(serverId);
        
        for (const role of binding.roles) {
          if (!guild?.roles.cache.get(role)) {
            return res.status(400).json({ error: 'Invalid role' });
          }
        }
      }
      
    }
    
    try {
      // add, delete, and update bindings
      await Database.transaction(async (tx) => {
        console.log('Starting transaction');
        // Add
        if (bindingRequest.insert && bindingRequest.insert.length > 0) {
          const values = bindingRequest.insert.map(binding => ({
            serverId: serverId,
            groupName: binding.groupName,
            rank: binding.rank,
            secondaryRank: binding.secondaryRank || null,
            operator: binding.operator,
            roles: JSON.stringify(binding.roles)
          }));
    
          console.log('Inserting bindings');
          await tx.insert(Database.bindings).values(values);
        }
  
        // Delete
        if (bindingRequest.delete && bindingRequest.delete.length > 0) {
          console.log('Deleting bindings');
          
          await tx.delete(Database.bindings)
          .where(
            and(
              inArray(Database.bindings.id, bindingRequest.delete.map(id => parseInt(id))),
              eq(Database.bindings.serverId, serverId)
            )
          );
        }
  
        // Update
        if (bindingRequest.update.length > 0) {
          const idList = bindingRequest.update.map(binding => {
            if (binding.id) {
              return `'${binding.id}'`;
            } else {
              return 'NULL';
            }
          });

          console.log('Updating bindings');
          const groupNameCases = bindingRequest.update.map(b => 
            `WHEN '${b.id}' THEN ?`).join(' ');

          // They're all the same string
          const rankCases = groupNameCases
          const secondaryRankCases = groupNameCases
          const operatorCases = groupNameCases
          const rolesCases = groupNameCases
    
          // Params in order
          const params = [
            ...bindingRequest.update.map(b => b.groupName),
            ...bindingRequest.update.map(b => b.rank),
            ...bindingRequest.update.map(b => b.secondaryRank || null),
            ...bindingRequest.update.map(b => b.operator),
            ...bindingRequest.update.map(b => JSON.stringify(b.roles)),
            serverId
          ];

          await tx.update(Database.bindings).set({
            groupName: sql`CASE id
              ${groupNameCases}
              ELSE groupName
            END`,

            rank: sql`CASE id
              ${rankCases}
              ELSE \`rank\`
            END`,

            secondaryRank: sql`CASE id
              ${secondaryRankCases}
              ELSE secondaryRank
            END`,

            operator: sql`CASE id
              ${operatorCases}
              ELSE operator
            END`,

            roles: sql`CASE id
              ${rolesCases}
              ELSE roles
            END`,
          }).where(inArray(Database.bindings.id, idList.map(id => parseInt(id))));
        }
      });

      if (sessionResponse.needsUpdate) {
        await Database.update(Database.users).set({
          token: sessionResponse.data.token,
          refreshToken: sessionResponse.data.refreshToken,
          tokenExpires: sessionResponse.data.expiresIn
        }).where(eq(Database.users.token, session));
      }
  
      res.cookie('session', JSON.stringify({token: sessionResponse.data.token, refreshToken: sessionResponse.data.refreshToken}), {
        httpOnly: true,
        secure: true,
        maxAge: COOKIE_EXPIRATION,
        sameSite: 'none',
      });
  
      res.json({ success: true })

    } catch (error) {
      console.error('Error saving binding:', error);
      res.status(500).json({ error: 'Failed to save binding' });
    }
})

export default router; 