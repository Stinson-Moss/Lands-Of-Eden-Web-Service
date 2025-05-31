UPDATE bindings
          SET 
            groupName = CASE id
              ${groupNameCases}
              ELSE groupName
            END,
            `rank` = CASE id
              ${rankCases}
              ELSE `rank`
            END,
            secondaryRank = CASE id
              ${secondaryRankCases}
              ELSE secondaryRank
            END,
            operator = CASE id
              ${operatorCases}
              ELSE operator
            END,
            roles = CASE id
              ${rolesCases}
              ELSE roles
            END
            WHERE id IN (${idList.join(',')}) AND serverId = ?
            SUCK
            WHERE OUT OF BOUNDS NERD
            
