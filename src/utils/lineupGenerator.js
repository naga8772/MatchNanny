// Smart Lineup Algorithm - Migrated from HTML version
// utils/lineupGenerator.js

import { supabase } from '../services/supabase';

export class LineupGenerator {
  constructor() {
    this.strengthValues = { "High": 3, "Medium": 2, "Low": 1 };
  }

  // Get pairing key for tracking history
  getPairingKey(player1, player2) {
    return [player1, player2].sort().join('-');
  }

  // Check if players were recently paired (within last 4 weeks)
  wasRecentlyPaired(player1Name, player2Name, pairingHistory, currentWeek) {
    const pairingKey = this.getPairingKey(player1Name, player2Name);
    return pairingHistory.some(week => 
      week.week > currentWeek - 4 && 
      week.pairings.includes(pairingKey)
    );
  }

  // Calculate team balance (sum of player strengths)
  getTeamBalance(player1, player2) {
    return this.strengthValues[player1.strength] + this.strengthValues[player2.strength];
  }

  // Check if player can play specific position
  canPlayPosition(player, position) {
    if (player.preference === "Both sides") return true;
    if (position === "Deuce" && player.preference === "Deuce side") return true;
    if (position === "Ad" && player.preference === "Ad side") return true;
    return false;
  }

  // Assign positions based on preferences
  assignPositions(team) {
    const [p1, p2] = team;
    
    // Try to honor preferences first
    if (this.canPlayPosition(p1, "Deuce") && this.canPlayPosition(p2, "Ad")) {
      return { deuce: p1, ad: p2 };
    } else if (this.canPlayPosition(p1, "Ad") && this.canPlayPosition(p2, "Deuce")) {
      return { deuce: p2, ad: p1 };
    } else {
      // Random assignment if no clear preference match
      return Math.random() > 0.5 ? { deuce: p1, ad: p2 } : { deuce: p2, ad: p1 };
    }
  }

  // Generate optimal lineup
  async generateOptimalLineup(rotationId, availablePlayerIds, currentWeek, pairingHistory = []) {
    try {
      // Get available players from database
      const { data: allPlayers, error } = await supabase
        .from('players')
        .select('*')
        .eq('rotation_id', rotationId)
        .in('id', availablePlayerIds);

      if (error) throw error;

      if (allPlayers.length < 4) {
 	 throw new Error("Need at least 4 players for 1 line of doubles");
	}

      // Determine number of lines based on available players
      const numLines = Math.min(Math.floor(allPlayers.length / 4), 4); // Max 4 lines, 16 players
      const playersNeeded = numLines * 4;
      
      if (allPlayers.length < playersNeeded) {
        throw new Error(`Need ${playersNeeded} players for ${numLines} lines of doubles`);
      }

      // Sort players by strength (strongest first)
      const sortedPlayers = allPlayers
        .sort((a, b) => this.strengthValues[b.strength] - this.strengthValues[a.strength]);

      let bestLineup = null;
      let bestScore = -1;
      let attempts = 0;
      const maxAttempts = 1000;

      // Try multiple random arrangements to find the best lineup
      while (attempts < maxAttempts && bestScore < 0.8) {
        attempts++;
        
        // Shuffle players randomly for this attempt
        const shuffledPlayers = [...sortedPlayers].sort(() => Math.random() - 0.5);
        const selectedPlayers = shuffledPlayers.slice(0, playersNeeded);
        
        const lineup = [];
        let validLineup = true;

        // Generate each line
        for (let line = 0; line < numLines && validLineup; line++) {
          const lineStart = line * 4;
          const linePlayers = selectedPlayers.slice(lineStart, lineStart + 4);
          
          // Try different pairing combinations for this line
          const pairingOptions = [
            [[0, 1], [2, 3]], // Players 0&1 vs 2&3
            [[0, 2], [1, 3]], // Players 0&2 vs 1&3
            [[0, 3], [1, 2]]  // Players 0&3 vs 1&2
          ];

          let bestLinePairing = null;
          let bestLineScore = -1;

          // Evaluate each pairing option
          for (const pairing of pairingOptions) {
            const team1 = [linePlayers[pairing[0][0]], linePlayers[pairing[0][1]]];
            const team2 = [linePlayers[pairing[1][0]], linePlayers[pairing[1][1]]];

            // Check if teams were recently paired together
            const team1Recent = this.wasRecentlyPaired(
              team1[0].name, team1[1].name, pairingHistory, currentWeek
            );
            const team2Recent = this.wasRecentlyPaired(
              team2[0].name, team2[1].name, pairingHistory, currentWeek
            );
            
            // Skip if either team was recently paired
            if (team1Recent || team2Recent) continue;

            // Calculate team balances
            const balance1 = this.getTeamBalance(team1[0], team1[1]);
            const balance2 = this.getTeamBalance(team2[0], team2[1]);
            const balanceDiff = Math.abs(balance1 - balance2);
            
            // Score this pairing (lower difference is better)
            const balanceScore = Math.max(0, 1 - balanceDiff / 4);

            if (balanceScore > bestLineScore) {
              bestLineScore = balanceScore;
              bestLinePairing = { team1, team2, balance1, balance2 };
            }
          }

          if (bestLinePairing) {
            // Assign positions within teams
            const team1Positions = this.assignPositions(bestLinePairing.team1);
            const team2Positions = this.assignPositions(bestLinePairing.team2);

            lineup.push({
              line: line + 1,
              team1: team1Positions,
              team2: team2Positions,
              balance: [bestLinePairing.balance1, bestLinePairing.balance2]
            });
          } else {
            validLineup = false;
          }
        }

        // Score the complete lineup
        if (validLineup && lineup.length === numLines) {
          const avgBalance = lineup.reduce((sum, line) => 
            sum + Math.abs(line.balance[0] - line.balance[1]), 0) / numLines;
          const score = Math.max(0, 1 - avgBalance / 4);

          if (score > bestScore) {
            bestScore = score;
            bestLineup = lineup;
          }
        }
      }

      if (!bestLineup) {
        throw new Error("Could not generate optimal lineup. Try regenerating or check player availability.");
      }

      return {
        lineup: bestLineup,
        score: bestScore,
        attempts: attempts,
        metadata: {
          totalPlayers: allPlayers.length,
          linesGenerated: numLines,
          averageBalance: bestLineup.reduce((sum, line) => 
            sum + Math.abs(line.balance[0] - line.balance[1]), 0) / numLines
        }
      };

    } catch (error) {
      console.error('Lineup generation error:', error);
      throw error;
    }
  }

  // Save lineup to database with pairing history and date support
  async saveLineup(rotationId, lineup, matchDate, matchTime) {
    try {
      // Extract pairings for history tracking
      const weekPairings = [];
      lineup.forEach(line => {
        weekPairings.push(this.getPairingKey(line.team1.deuce.name, line.team1.ad.name));
        weekPairings.push(this.getPairingKey(line.team2.deuce.name, line.team2.ad.name));
      });

      // Get next week number (for compatibility)
      const { data: existingLineups } = await supabase
        .from('lineups')
        .select('week_number')
        .eq('rotation_id', rotationId)
        .order('week_number', { ascending: false })
        .limit(1);
      
      const nextWeekNumber = existingLineups && existingLineups.length > 0 
        ? existingLineups[0].week_number + 1 
        : 1;

      console.log('Saving lineup:', {
        rotation_id: rotationId,
        week_number: nextWeekNumber,
        match_date: matchDate,
        match_time: matchTime,
        lineup_data: {
          lineup: lineup,
          pairings: weekPairings,
          generated_at: new Date().toISOString()
        }
      });

      // Save lineup to database
      const { data, error } = await supabase
        .from('lineups')
        .insert({
          rotation_id: rotationId,
          week_number: nextWeekNumber,
          match_date: matchDate,
          match_time: matchTime,
          lineup_data: {
            lineup: lineup,
            pairings: weekPairings,
            generated_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Lineup saved successfully:', data);

      return {
        success: true,
        lineupId: data.id,
        week: nextWeekNumber,
        matchDate: matchDate,
        pairings: weekPairings
      };

    } catch (error) {
      console.error('Error saving lineup:', error);
      throw new Error(`Failed to save lineup: ${error.message}`);
    }
  }

  // Get pairing history for a rotation
  async getPairingHistory(rotationId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('lineups')
        .select('week_number, lineup_data, created_at')
        .eq('rotation_id', rotationId)
        .order('week_number', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(record => ({
        week: record.week_number,
        date: new Date(record.created_at).toLocaleDateString(),
        pairings: record.lineup_data.pairings || [],
        lineup: record.lineup_data.lineup || []
      }));

    } catch (error) {
      console.error('Error getting pairing history:', error);
      return [];
    }
  }
}

// Export singleton instance
export const lineupGenerator = new LineupGenerator();