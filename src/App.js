import React, { useState, useEffect, useCallback } from 'react';
import { supabase, getRotations, getPlayersByRotation } from './services/supabase';
import { lineupGenerator } from './utils/lineupGenerator';
import './App.css';

// Player Form Component
const PlayerForm = ({ player, onSave, onCancel, isEditing = false, playerType = 'regular' }) => {
  const [formData, setFormData] = useState({
    name: player?.name || '',
    phone: player?.phone || '',
    email: player?.email || '',
    strength: player?.strength || 'Medium',
    style: player?.style || 'Right Handed',
    preference: player?.preference || 'Both sides',
    role: player?.role || (playerType === 'substitute' ? 'Substitute' : 'Player')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {isEditing ? 'Edit Player' : `Add New ${playerType === 'substitute' ? 'Substitute' : 'Player'}`}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Strength</label>
            <select
              value={formData.strength}
              onChange={(e) => setFormData({...formData, strength: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Playing Style</label>
            <select
              value={formData.style}
              onChange={(e) => setFormData({...formData, style: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Right Handed">Right Handed</option>
              <option value="Left Handed">Left Handed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position Preference</label>
            <select
              value={formData.preference}
              onChange={(e) => setFormData({...formData, preference: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Both sides">Both sides</option>
              <option value="Deuce side">Deuce side</option>
              <option value="Ad side">Ad side</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Player">Player</option>
              <option value="Captain">Captain</option>
              <option value="Co-Captain">Co-Captain</option>
              <option value="Substitute">Substitute</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {isEditing ? 'Update' : 'Add'} Player
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MatchNanny = () => {
  // State management
  const [rotations, setRotations] = useState([]);
  const [currentRotation, setCurrentRotation] = useState('');
  const [regularPlayers, setRegularPlayers] = useState([]);
  const [substitutePlayers, setSubstitutePlayers] = useState([]);
  const [availableRegular, setAvailableRegular] = useState(new Set());
  const [availableSubstitutes, setAvailableSubstitutes] = useState(new Set());
  const [currentLineup, setCurrentLineup] = useState([]);
  const [pairingHistory, setPairingHistory] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [upcomingDates, setUpcomingDates] = useState([]);
  const [activeTab, setActiveTab] = useState('lineup');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingType, setAddingType] = useState('regular');

  // New state for lineup viewer
  const [savedLineups, setSavedLineups] = useState([]);
  const [selectedViewDate, setSelectedViewDate] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedLineup, setEditedLineup] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Get current rotation details
  const getCurrentRotation = useCallback(() => 
    rotations.find(r => r.id === currentRotation), 
    [rotations, currentRotation]
  );

  // Load rotations from database
  const loadRotations = useCallback(async () => {
    try {
      setLoading(true);
      const rotationsData = await getRotations();
      setRotations(rotationsData);
      
      if (rotationsData.length > 0 && !currentRotation) {
        setCurrentRotation(rotationsData[0].id);
      }
    } catch (err) {
      setError('Failed to load rotations: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [currentRotation]);

  // Load saved lineups from database
  const loadSavedLineups = async (rotationId) => {
    if (!rotationId) return;
    
    try {
      const { data, error } = await supabase
        .from('lineups')
        .select('*')
        .eq('rotation_id', rotationId)
        .order('match_date', { ascending: false });

      if (error) throw error;

      // Debug logging to see what dates are stored
      console.log('Loaded lineups from database:', data);
      data?.forEach(lineup => {
        console.log(`Lineup ID ${lineup.id}: match_date = "${lineup.match_date}", formatted = "${formatDateDisplay(lineup.match_date)}"`);
      });

      setSavedLineups(data || []);
    } catch (err) {
      console.error('Failed to load saved lineups:', err);
    }
  };

  // Generate upcoming dates for current rotation
  const generateUpcomingDates = useCallback((rotation) => {
    if (!rotation || rotation.day_of_week === null) return [];
    
    const dates = [];
    const today = new Date();
    const targetDay = rotation.day_of_week; // 0=Sunday, 1=Monday, etc.
    
    // Find next 8 occurrences of the target day
    for (let i = 0; i < 60; i++) { // Check next 60 days
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      
      if (checkDate.getDay() === targetDay && checkDate >= today) {
        // Use timezone-safe date formatting instead of toISOString()
        const year = checkDate.getFullYear();
        const month = String(checkDate.getMonth() + 1).padStart(2, '0');
        const day = String(checkDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        
        const displayString = checkDate.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        });
        
        dates.push({
          date: dateString,
          display: displayString,
          time: rotation.start_time
        });
        
        if (dates.length >= 8) break; // Get next 8 dates
      }
    }
    
    return dates;
  }, []);

  // Load players for current rotation
  const loadPlayers = useCallback(async (rotationId) => {
    if (!rotationId) return;
    
    try {
      const players = await getPlayersByRotation(rotationId);
      const regular = players.filter(p => p.role !== 'Substitute');
      const subs = players.filter(p => p.role === 'Substitute');
      
      setRegularPlayers(regular);
      setSubstitutePlayers(subs);
      setAvailableRegular(new Set());
      setAvailableSubstitutes(new Set());
      setCurrentLineup([]);
      
      const history = await lineupGenerator.getPairingHistory(rotationId);
      setPairingHistory(history);
      
      // Load saved lineups
      await loadSavedLineups(rotationId);
      
      // Generate upcoming dates for this rotation
      const currentRot = rotations.find(r => r.id === rotationId);
      if (currentRot) {
        const dates = generateUpcomingDates(currentRot);
        setUpcomingDates(dates);
        // Always set the first upcoming date when rotation changes
        if (dates.length > 0) {
          setSelectedDate(dates[0].date);
        }
        // Reset viewer date when changing rotations
        setSelectedViewDate(null);
      }
    } catch (err) {
      setError('Failed to load players: ' + err.message);
    }
  }, [rotations, generateUpcomingDates]);

  useEffect(() => {
    loadRotations();
  }, [loadRotations]);

  useEffect(() => {
    if (currentRotation) {
      loadPlayers(currentRotation);
    }
  }, [currentRotation, loadPlayers]);

  // Helper functions
  const getStrengthColor = (strength) => {
    switch (strength) {
      case "High": return "text-red-600";
      case "Medium": return "text-yellow-600";
      case "Low": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  // Helper function to safely parse dates without timezone issues
  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    
    // Parse the date string (YYYY-MM-DD) directly
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateDisplayLong = (dateString) => {
    if (!dateString) return '';
    
    // Parse the date string (YYYY-MM-DD) directly
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Determine if date is in the past
  const isPastDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Toggle player availability
  const togglePlayerAvailability = (playerId, isSubstitute = false) => {
    if (isSubstitute) {
      const newAvailable = new Set(availableSubstitutes);
      if (newAvailable.has(playerId)) {
        newAvailable.delete(playerId);
      } else {
        newAvailable.add(playerId);
      }
      setAvailableSubstitutes(newAvailable);
    } else {
      const newAvailable = new Set(availableRegular);
      if (newAvailable.has(playerId)) {
        newAvailable.delete(playerId);
      } else {
        newAvailable.add(playerId);
      }
      setAvailableRegular(newAvailable);
    }
  };

  // Generate smart lineup
  const generateLineup = async () => {
    if (!currentRotation || !selectedDate) {
      alert("Please select a date for the match");
      return;
    }
    
    const availableIds = [...availableRegular, ...availableSubstitutes];
    if (availableIds.length < 4) {
      alert("Need at least 4 players for 1 line of doubles");
      return;
    }
    
    try {
      setGenerating(true);
      
      console.log('Generating lineup with:', {
        rotation: currentRotation,
        date: selectedDate,
        playerCount: availableIds.length,
        playerIds: availableIds
      });
      
      const result = await lineupGenerator.generateOptimalLineup(
        currentRotation, availableIds, 1, pairingHistory
      );
      
      console.log('Generated lineup result:', {
        lineCount: result.lineup.length,
        totalPlayers: result.metadata.totalPlayers,
        linesGenerated: result.metadata.linesGenerated
      });
      
      setCurrentLineup(result.lineup);
      alert(`Lineup generated successfully!\n\nScore: ${(result.score * 100).toFixed(1)}%\nAttempts: ${result.attempts}\nLines Generated: ${result.metadata.linesGenerated}\nTotal Players: ${result.metadata.totalPlayers}\nAverage Balance Difference: ${result.metadata.averageBalance.toFixed(1)}`);
    } catch (err) {
      console.error('Lineup generation error:', err);
      alert('Error generating lineup: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Save lineup and update history
  const saveLineup = async () => {
    if (currentLineup.length === 0 || !currentRotation || !selectedDate) {
      alert("No lineup to save or missing date");
      return;
    }
    
    try {
      const currentRot = getCurrentRotation();
      const matchTime = currentRot?.start_time || '06:00:00';
      
      // Debug logging to see what date we're trying to save
      console.log('Saving lineup with selectedDate:', selectedDate);
      console.log('Selected date formatted:', formatDateDisplay(selectedDate));
      
      console.log('Attempting to save lineup:', {
        rotation: currentRotation,
        date: selectedDate,
        time: matchTime,
        lineupLength: currentLineup.length
      });
      
      const result = await lineupGenerator.saveLineup(
        currentRotation, 
        currentLineup, 
        selectedDate,
        matchTime
      );
      
      if (result.success) {
        // Update pairing history
        const newHistoryEntry = {
          week: result.week,
          date: selectedDate,
          pairings: result.pairings,
          lineup: currentLineup
        };
        setPairingHistory([newHistoryEntry, ...pairingHistory]);
        
        // Reload saved lineups
        await loadSavedLineups(currentRotation);
        
        // Reset for next lineup
        setCurrentLineup([]);
        setAvailableRegular(new Set());
        setAvailableSubstitutes(new Set());
        
        // Move to next available date
        const currentDateIndex = upcomingDates.findIndex(d => d.date === selectedDate);
        if (currentDateIndex >= 0 && currentDateIndex < upcomingDates.length - 1) {
          setSelectedDate(upcomingDates[currentDateIndex + 1].date);
        }
        
        alert(`Lineup saved successfully for ${selectedDate}!\nReady for next match.`);
      }
    } catch (err) {
      console.error('Save lineup error:', err);
      alert('Error saving lineup: ' + err.message);
    }
  };

  // Lineup viewer functions
  const handleRegenerateLineup = async () => {
    setIsRegenerating(true);
    try {
      // Get the original lineup to extract player names
      const selectedLineup = savedLineups.find(l => l.match_date === selectedViewDate);
      if (!selectedLineup || !selectedLineup.lineup_data?.lineup) {
        alert('No lineup found to regenerate');
        return;
      }

      // Extract player names from the original lineup
      const originalLineup = selectedLineup.lineup_data.lineup;
      const originalPlayerNames = new Set();
      
      originalLineup.forEach(line => {
        originalPlayerNames.add(line.team1.deuce.name);
        originalPlayerNames.add(line.team1.ad.name);
        originalPlayerNames.add(line.team2.deuce.name);
        originalPlayerNames.add(line.team2.ad.name);
      });

      // Find the actual player objects that match these names
      const allPlayers = [...regularPlayers, ...substitutePlayers];
      const originalPlayerObjects = allPlayers.filter(p => originalPlayerNames.has(p.name));
      const playerIds = originalPlayerObjects.map(p => p.id);
      
      console.log('Regenerating with original players:', {
        originalPlayerNames: Array.from(originalPlayerNames),
        foundPlayers: originalPlayerObjects.length,
        playerIds: playerIds
      });
      
      if (playerIds.length < 4) {
        alert('Need at least 4 players to regenerate lineup');
        return;
      }

      // Get current week number
      const currentWeek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
      
      // Get pairing history
      const history = await lineupGenerator.getPairingHistory(currentRotation, 10);
      
      // Generate new lineup with the same players
      const result = await lineupGenerator.generateOptimalLineup(
        currentRotation,
        playerIds,
        currentWeek,
        history
      );

      setEditedLineup(result.lineup);
      alert(`Lineup regenerated with ${originalPlayerObjects.length} original players!\nScore: ${(result.score * 100).toFixed(1)}%`);
    } catch (error) {
      console.error('Error regenerating lineup:', error);
      alert(`Error regenerating lineup: ${error.message}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSaveEdits = async () => {
    if (editedLineup && selectedViewDate) {
      try {
        // Update the lineup in database
        const selectedLineup = savedLineups.find(l => l.match_date === selectedViewDate);
        if (selectedLineup) {
          const { error } = await supabase
            .from('lineups')
            .update({
              lineup_data: {
                lineup: editedLineup,
                generated_at: new Date().toISOString()
              }
            })
            .eq('id', selectedLineup.id);

          if (error) throw error;

          // Reload saved lineups
          await loadSavedLineups(currentRotation);
          
          setEditMode(false);
          setEditedLineup(null);
          alert('Lineup updated successfully!');
        }
      } catch (error) {
        console.error('Error saving edits:', error);
        alert(`Error saving edits: ${error.message}`);
      }
    }
  };

  const handleDeleteLineup = async () => {
    if (selectedViewDate && window.confirm('Are you sure you want to delete this lineup?')) {
      try {
        const selectedLineup = savedLineups.find(l => l.match_date === selectedViewDate);
        if (selectedLineup) {
          const { error } = await supabase
            .from('lineups')
            .delete()
            .eq('id', selectedLineup.id);

          if (error) throw error;

          // Reload saved lineups
          await loadSavedLineups(currentRotation);
          
          setSelectedViewDate(null);
          setEditMode(false);
          setEditedLineup(null);
          alert('Lineup deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting lineup:', error);
        alert(`Error deleting lineup: ${error.message}`);
      }
    }
  };

  const handlePrintLineup = (lineup, date) => {
    if (!lineup) return;

    const currentRot = getCurrentRotation();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${currentRot?.name || 'MatchNanny'} - ${date}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .line { margin-bottom: 25px; page-break-inside: avoid; }
            .line-header { background-color: #f0f0f0; padding: 10px; font-weight: bold; }
            .teams { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 15px; }
            .team { border: 1px solid #ccc; padding: 10px; }
            .team-header { font-weight: bold; margin-bottom: 10px; }
            .player { padding: 5px; margin-bottom: 5px; border-bottom: 1px solid #eee; }
            .player-name { font-weight: bold; }
            .player-details { font-size: 12px; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${currentRot?.name || 'MatchNanny'}</h1>
            <h2>${date}</h2>
            <p>${currentRot?.schedule || ''}</p>
          </div>
          ${lineup.map(line => `
            <div class="line">
              <div class="line-header">Line ${line.line}</div>
              <div class="teams">
                <div class="team">
                  <div class="team-header">Team 1</div>
                  <div class="player">
                    <div class="player-name">${line.team1.deuce.name} (Deuce)</div>
                    <div class="player-details">${line.team1.deuce.strength?.toUpperCase() || 'MEDIUM'}</div>
                  </div>
                  <div class="player">
                    <div class="player-name">${line.team1.ad.name} (Ad)</div>
                    <div class="player-details">${line.team1.ad.strength?.toUpperCase() || 'MEDIUM'}</div>
                  </div>
                </div>
                <div class="team">
                  <div class="team-header">Team 2</div>
                  <div class="player">
                    <div class="player-name">${line.team2.deuce.name} (Deuce)</div>
                    <div class="player-details">${line.team2.deuce.strength?.toUpperCase() || 'MEDIUM'}</div>
                  </div>
                  <div class="player">
                    <div class="player-name">${line.team2.ad.name} (Ad)</div>
                    <div class="player-details">${line.team2.ad.strength?.toUpperCase() || 'MEDIUM'}</div>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Add sample players
  const addSamplePlayers = async () => {
    if (!currentRotation) return;
    
    const samplePlayers = [
      { name: "Carrie Currier", phone: "", strength: "Medium", style: "Right Handed", preference: "Both sides", role: "Captain" },
      { name: "Naganand Jagadeesh", phone: "", strength: "Medium", style: "Right Handed", preference: "Both sides", role: "Player" },
      { name: "Brian Schwarzlose", phone: "", strength: "High", style: "Right Handed", preference: "Both sides", role: "Player" },
      { name: "Don Buford", phone: "", strength: "Low", style: "Right Handed", preference: "Deuce side", role: "Player" },
      { name: "Jacinto Rivera", phone: "", strength: "Medium", style: "Right Handed", preference: "Both sides", role: "Player" },
      { name: "Jeff LaSelle", phone: "", strength: "Medium", style: "Right Handed", preference: "Ad side", role: "Player" },
      { name: "Mike Johnson", phone: "", strength: "Medium", style: "Right Handed", preference: "Both sides", role: "Substitute" },
      { name: "Sarah Williams", phone: "", strength: "Low", style: "Left Handed", preference: "Ad side", role: "Substitute" }
    ];

    try {
      const playersWithRotation = samplePlayers.map(player => ({
        ...player,
        rotation_id: currentRotation
      }));

      const { error } = await supabase.from('players').insert(playersWithRotation);
      if (error) throw error;
      
      await loadPlayers(currentRotation);
      alert('Sample players added successfully!');
    } catch (err) {
      alert('Error adding players: ' + err.message);
    }
  };

  // Player management functions
  const addPlayer = async (playerData) => {
    if (!currentRotation) return;
    
    try {
      const { error } = await supabase
        .from('players')
        .insert({
          ...playerData,
          rotation_id: currentRotation
        });

      if (error) throw error;
      
      await loadPlayers(currentRotation);
      setShowAddForm(false);
      alert('Player added successfully!');
    } catch (err) {
      alert('Error adding player: ' + err.message);
    }
  };

  const editPlayer = async (playerId, playerData) => {
    try {
      const { error } = await supabase
        .from('players')
        .update(playerData)
        .eq('id', playerId);

      if (error) throw error;
      
      await loadPlayers(currentRotation);
      setEditingPlayer(null);
      alert('Player updated successfully!');
    } catch (err) {
      alert('Error updating player: ' + err.message);
    }
  };

  const deletePlayer = async (playerId) => {
    if (!window.confirm('Are you sure you want to delete this player?')) return;
    
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);

      if (error) throw error;
      
      await loadPlayers(currentRotation);
      alert('Player deleted successfully!');
    } catch (err) {
      alert('Error deleting player: ' + err.message);
    }
  };

  // Render player card
  const renderPlayerCard = (player, isAvailable, isSubstitute = false) => (
    <div
      key={player.id}
      className={`p-3 border rounded-lg transition-all ${
        isAvailable
          ? 'bg-blue-50 border-blue-300 shadow-md'
          : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center space-x-2 cursor-pointer flex-1"
          onClick={() => togglePlayerAvailability(player.id, isSubstitute)}
        >
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={() => {}}
            className="h-4 w-4 text-blue-600"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-800 flex items-center">
              {player.name}
              {player.role === 'Captain' && (
                <span className="ml-2 text-yellow-500" title="Captain">👑</span>
              )}
              {player.role === 'Co-Captain' && (
                <span className="ml-2 text-blue-500" title="Co-Captain">⭐</span>
              )}
            </div>
            {player.phone && (
              <div className="text-xs text-gray-500 flex items-center">
                📞 {player.phone}
              </div>
            )}
            <div className="text-sm text-gray-600">
              <span className={`font-medium ${getStrengthColor(player.strength)}`}>
                {player.strength}
              </span>
              {player.style === "Left Handed" && (
                <span className="ml-2 text-purple-600 font-medium">(LH)</span>
              )}
              <div className="text-xs text-gray-500">{player.preference}</div>
            </div>
          </div>
        </div>
        {activeTab === 'manage' && (
          <div className="flex space-x-1">
            <button
              onClick={() => setEditingPlayer(player)}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
              title="Edit Player"
            >
              ✏️
            </button>
            <button
              onClick={() => deletePlayer(player.id)}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
              title="Delete Player"
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎾</div>
          <div className="text-xl font-semibold text-gray-700">Loading MatchNanny...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-xl font-semibold text-red-600 mb-2">Oops!</div>
          <div className="text-gray-700">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <span className="text-4xl">🎾</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">MatchNanny</h1>
              <p className="text-gray-600 font-bold text-blue-800">Brookhaven Racquet Club</p>
              <p className="text-sm text-gray-500">Professional Adult Supervision for Tennis Teams</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
              <span className="text-blue-600">📅</span>
              <span className="font-semibold text-blue-800">
                Today: {new Date().toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            <div className="text-xs text-gray-500">✅ Connected to Database</div>
          </div>
        </div>

        {/* Rotation Selector */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-orange-500 text-lg">⭐</span>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Rotation</label>
                <select
                  value={currentRotation}
                  onChange={(e) => setCurrentRotation(e.target.value)}
                  className="text-lg font-semibold px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {rotations.map(rotation => (
                    <option key={rotation.id} value={rotation.id}>{rotation.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">{getCurrentRotation()?.schedule}</div>
              <div className="text-xs text-gray-500 italic">{getCurrentRotation()?.description}</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('lineup')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
              activeTab === 'lineup' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Generate Lineup
          </button>
          <button
            onClick={() => setActiveTab('view')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
              activeTab === 'view' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            View Lineups
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
              activeTab === 'manage' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Manage Players
          </button>
        </div>

        {activeTab === 'lineup' && (
          <>
            {/* Date Selection */}
            {upcomingDates.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-blue-600 text-lg">📅</span>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Match Date
                      </label>
                      <select
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="text-lg font-semibold px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {upcomingDates.map(dateInfo => (
                          <option key={dateInfo.date} value={dateInfo.date}>
                            {dateInfo.display}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">{getCurrentRotation()?.schedule}</div>
                    <div className="text-xs text-gray-500 italic">
                      {getCurrentRotation()?.start_time && 
                        new Date(`2000-01-01T${getCurrentRotation().start_time}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Show sample data button if no players */}
            {regularPlayers.length === 0 && (
              <div className="text-center py-8 mb-8 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Players Found</h3>
                <p className="text-yellow-700 mb-4">This rotation doesn't have any players yet.</p>
                <button
                  onClick={addSamplePlayers}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Add Sample Players
                </button>
              </div>
            )}

            {/* Regular Players Section */}
            {regularPlayers.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    👥 Regular Players ({availableRegular.size}/{regularPlayers.length})
                  </h2>
                  <div className="space-x-2">
                    <button
                      onClick={() => setAvailableRegular(new Set(regularPlayers.map(p => p.id)))}
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setAvailableRegular(new Set())}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {regularPlayers.map((player) => 
                    renderPlayerCard(player, availableRegular.has(player.id), false)
                  )}
                </div>
              </div>
            )}

            {/* Substitute Players Section */}
            {substitutePlayers.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-orange-800 flex items-center">
                    🔄 Substitute Players ({availableSubstitutes.size}/{substitutePlayers.length})
                  </h2>
                  <div className="space-x-2">
                    <button
                      onClick={() => setAvailableSubstitutes(new Set(substitutePlayers.map(p => p.id)))}
                      className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setAvailableSubstitutes(new Set())}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {substitutePlayers.map((player) => 
                    renderPlayerCard(player, availableSubstitutes.has(player.id), true)
                  )}
                </div>
              </div>
            )}

            {/* Generate Lineup Button */}
            {(regularPlayers.length > 0 || substitutePlayers.length > 0) && (
              <div className="flex justify-center space-x-4 mb-8">
                <button
                  onClick={generateLineup}
                  disabled={availableRegular.size + availableSubstitutes.size < 4 || generating || !selectedDate}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <span>{generating ? '⏳' : '🔄'}</span>
                  <span>{generating ? 'Generating...' : 'Generate Smart Lineup'}</span>
                </button>
                
                {currentLineup.length > 0 && (
                  <button
                    onClick={saveLineup}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <span>💾</span>
                    <span>Save Lineup</span>
                  </button>
                )}
              </div>
            )}

            {/* Lineup Display */}
            {currentLineup.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Generated Lineup - {formatDateDisplay(selectedDate)}
                </h3>
                <p className="text-green-700">🎉 Smart lineup generated with {currentLineup.length} lines!</p>
                <div className="mt-2 text-sm text-green-600">
                  Click "Save Lineup" to store this lineup and move to the next match date.
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'view' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                👁️ Lineup History
              </h2>

              {savedLineups.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📅</div>
                  <p className="text-gray-600">No lineups saved yet.</p>
                  <p className="text-sm text-gray-500">Generate your first lineup to see it here!</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Date List */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Saved Lineups ({savedLineups.length})</h3>
                    <div className="space-y-2">
                      {savedLineups.map(lineup => {
                        const past = isPastDate(lineup.match_date);
                        const lineCount = lineup.lineup_data?.lineup?.length || 0;
                        
                        return (
                          <button
                            key={lineup.id}
                            onClick={() => {
                              setSelectedViewDate(lineup.match_date);
                              setEditMode(false);
                              setEditedLineup(null);
                            }}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                              selectedViewDate === lineup.match_date
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {formatDateDisplay(lineup.match_date)}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center mt-1">
                                  ⏰ {past ? 'Past' : 'Future'} • {lineCount} lines • {lineCount * 4} players
                                </div>
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                past 
                                  ? 'bg-gray-100 text-gray-600' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {past ? 'View Only' : 'Editable'}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lineup Display */}
                  <div>
                    {selectedViewDate ? (
                      <div>
                        <div className="flex flex-col space-y-2 mb-4">
                          <h3 className="text-lg font-semibold">
                            {formatDateDisplayLong(selectedViewDate)}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                const selectedLineup = savedLineups.find(l => l.match_date === selectedViewDate);
                                if (selectedLineup) {
                                  const lineup = editedLineup || selectedLineup.lineup_data?.lineup;
                                  handlePrintLineup(lineup, selectedViewDate);
                                }
                              }}
                              className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-1 text-sm"
                            >
                              🖨️ <span>Print</span>
                            </button>
                            
                            {!isPastDate(selectedViewDate) && (
                              <>
                                {!editMode ? (
                                  <button
                                    onClick={() => {
                                      setEditMode(true);
                                      const selectedLineup = savedLineups.find(l => l.match_date === selectedViewDate);
                                      setEditedLineup(selectedLineup?.lineup_data?.lineup);
                                    }}
                                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-1 text-sm"
                                  >
                                    ✏️ <span>Edit</span>
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={handleRegenerateLineup}
                                      disabled={isRegenerating}
                                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center space-x-1 text-sm"
                                    >
                                      🔄 <span>{isRegenerating ? 'Generating...' : 'Regenerate'}</span>
                                    </button>
                                    <button
                                      onClick={handleSaveEdits}
                                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditMode(false);
                                        setEditedLineup(null);
                                      }}
                                      className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                                
                                <button
                                  onClick={handleDeleteLineup}
                                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-1 text-sm"
                                >
                                  🗑️ <span>Delete</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {editMode && (
                          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <strong>Edit Mode:</strong> You can regenerate the lineup with the current player roster. 
                              Click "Save" to keep your changes.
                            </p>
                          </div>
                        )}

                        {(() => {
                          const selectedLineup = savedLineups.find(l => l.match_date === selectedViewDate);
                          const displayLineup = editedLineup || selectedLineup?.lineup_data?.lineup;
                          
                          return displayLineup && (
                            <div className="space-y-4">
                              {displayLineup.map((line, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                                  <div className="bg-gray-50 px-4 py-2 border-b">
                                    <h4 className="font-semibold text-gray-900">Line {line.line}</h4>
                                  </div>
                                  <div className="p-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                      {/* Team 1 */}
                                      <div className="border border-gray-100 rounded p-3">
                                        <h5 className="font-medium text-gray-700 mb-2">Team 1</h5>
                                        <div className="space-y-2">
                                          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <div>
                                              <div className="font-medium text-gray-900">{line.team1.deuce.name}</div>
                                              <div className="text-sm text-gray-600">
                                                {line.team1.deuce.strength?.toUpperCase() || 'MEDIUM'} • Deuce Side
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <div>
                                              <div className="font-medium text-gray-900">{line.team1.ad.name}</div>
                                              <div className="text-sm text-gray-600">
                                                {line.team1.ad.strength?.toUpperCase() || 'MEDIUM'} • Ad Side
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Team 2 */}
                                      <div className="border border-gray-100 rounded p-3">
                                        <h5 className="font-medium text-gray-700 mb-2">Team 2</h5>
                                        <div className="space-y-2">
                                          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <div>
                                              <div className="font-medium text-gray-900">{line.team2.deuce.name}</div>
                                              <div className="text-sm text-gray-600">
                                                {line.team2.deuce.strength?.toUpperCase() || 'MEDIUM'} • Deuce Side
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <div>
                                              <div className="font-medium text-gray-900">{line.team2.ad.name}</div>
                                              <div className="text-sm text-gray-600">
                                                {line.team2.ad.strength?.toUpperCase() || 'MEDIUM'} • Ad Side
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <div className="text-4xl mb-2">📅</div>
                        <p className="text-gray-600">Select a date to view the lineup</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'manage' && (
          <>
            {/* Regular Players Management */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  👥 Regular Players ({regularPlayers.length})
                </h2>
                <button
                  onClick={() => {
                    setAddingType('regular');
                    setShowAddForm(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  ➕ <span>Add Player</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {regularPlayers.map((player) => 
                  renderPlayerCard(player, availableRegular.has(player.id), false)
                )}
              </div>
            </div>

            {/* Substitute Players Management */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-orange-800 flex items-center">
                  🔄 Substitute Players ({substitutePlayers.length})
                </h2>
                <button
                  onClick={() => {
                    setAddingType('substitute');
                    setShowAddForm(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  ➕ <span>Add Substitute</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {substitutePlayers.map((player) => 
                  renderPlayerCard(player, availableSubstitutes.has(player.id), true)
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Player Form Modal */}
      {(editingPlayer || showAddForm) && (
        <PlayerForm
          player={editingPlayer}
          playerType={addingType}
          onSave={(data) => {
            if (editingPlayer) {
              editPlayer(editingPlayer.id, data);
            } else {
              addPlayer(data);
            }
          }}
          onCancel={() => {
            setEditingPlayer(null);
            setShowAddForm(false);
          }}
          isEditing={!!editingPlayer}
        />
      )}
    </div>
  );
};

export default MatchNanny;