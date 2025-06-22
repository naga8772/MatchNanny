// src/App.js - Refactored and Streamlined
import React, { useState, useEffect, useCallback } from 'react';
import { supabase, getRotations, getPlayersByRotation } from './services/supabase';
import { lineupGenerator } from './utils/lineupGenerator';

// Components
import Header from './components/shared/Header';
import TabNavigation from './components/shared/TabNavigation';
import PlayerManagement from './components/PlayerManagement';
import LineupGenerator from './components/LineupGenerator';
import LineupViewer from './components/LineupViewer';

// Utilities
import { formatDateDisplay, formatDateDisplayLong, isPastDate, generateUpcomingDates } from './utils/dateHelpers';
import { filterPlayersByRole, togglePlayerInSet } from './utils/playerHelpers';

import './App.css';

const MatchNanny = () => {
  // Core state
  const [rotations, setRotations] = useState([]);
  const [currentRotation, setCurrentRotation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('lineup');

  // Player state
  const [regularPlayers, setRegularPlayers] = useState([]);
  const [substitutePlayers, setSubstitutePlayers] = useState([]);
  const [availableRegular, setAvailableRegular] = useState(new Set());
  const [availableSubstitutes, setAvailableSubstitutes] = useState(new Set());

  // Lineup generation state
  const [currentLineup, setCurrentLineup] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [upcomingDates, setUpcomingDates] = useState([]);
  const [pairingHistory, setPairingHistory] = useState([]);

  // Player management state
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingType, setAddingType] = useState('regular');

  // Lineup viewer state
  const [savedLineups, setSavedLineups] = useState([]);
  const [selectedViewDate, setSelectedViewDate] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedLineup, setEditedLineup] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Helper functions
  const getCurrentRotation = useCallback(() => 
    rotations.find(r => r.id === currentRotation), 
    [rotations, currentRotation]
  );

  // Data loading functions
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

  const loadSavedLineups = async (rotationId) => {
    if (!rotationId) return;
    
    try {
      const { data, error } = await supabase
        .from('lineups')
        .select('*')
        .eq('rotation_id', rotationId)
        .order('match_date', { ascending: false });

      if (error) throw error;
      setSavedLineups(data || []);
    } catch (err) {
      console.error('Failed to load saved lineups:', err);
    }
  };

  const loadPlayers = useCallback(async (rotationId) => {
    if (!rotationId) return;
    
    try {
      const players = await getPlayersByRotation(rotationId);
      const { regular, substitutes } = filterPlayersByRole(players);
      
      setRegularPlayers(regular);
      setSubstitutePlayers(substitutes);
      setAvailableRegular(new Set());
      setAvailableSubstitutes(new Set());
      setCurrentLineup([]);
      
      const history = await lineupGenerator.getPairingHistory(rotationId);
      setPairingHistory(history);
      
      await loadSavedLineups(rotationId);
      
      const currentRot = rotations.find(r => r.id === rotationId);
      if (currentRot) {
        const dates = generateUpcomingDates(currentRot);
        setUpcomingDates(dates);
        if (dates.length > 0) {
          setSelectedDate(dates[0].date);
        }
        setSelectedViewDate(null);
      }
    } catch (err) {
      setError('Failed to load players: ' + err.message);
    }
  }, [rotations]);

  // Player management functions
  const togglePlayerAvailability = (playerId, isSubstitute = false) => {
    if (isSubstitute) {
      setAvailableSubstitutes(togglePlayerInSet(availableSubstitutes, playerId));
    } else {
      setAvailableRegular(togglePlayerInSet(availableRegular, playerId));
    }
  };

  const addPlayer = async (playerData) => {
    if (!currentRotation) return;
    
    try {
      const { error } = await supabase
        .from('players')
        .insert({ ...playerData, rotation_id: currentRotation });

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

  // Lineup generation functions
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
      const result = await lineupGenerator.generateOptimalLineup(
        currentRotation, availableIds, 1, pairingHistory
      );
      
      setCurrentLineup(result.lineup);
      alert(`Lineup generated successfully!\n\nScore: ${(result.score * 100).toFixed(1)}%\nAttempts: ${result.attempts}\nLines Generated: ${result.metadata.linesGenerated}\nTotal Players: ${result.metadata.totalPlayers}`);
    } catch (err) {
      console.error('Lineup generation error:', err);
      alert('Error generating lineup: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const saveLineup = async () => {
    if (currentLineup.length === 0 || !currentRotation || !selectedDate) {
      alert("No lineup to save or missing date");
      return;
    }
    
    try {
      const currentRot = getCurrentRotation();
      const matchTime = currentRot?.start_time || '06:00:00';
      
      const result = await lineupGenerator.saveLineup(
        currentRotation, currentLineup, selectedDate, matchTime
      );
      
      if (result.success) {
        const newHistoryEntry = {
          week: result.week,
          date: selectedDate,
          pairings: result.pairings,
          lineup: currentLineup
        };
        setPairingHistory([newHistoryEntry, ...pairingHistory]);
        
        await loadSavedLineups(currentRotation);
        
        setCurrentLineup([]);
        setAvailableRegular(new Set());
        setAvailableSubstitutes(new Set());
        
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
      const selectedLineup = savedLineups.find(l => l.match_date === selectedViewDate);
      if (!selectedLineup || !selectedLineup.lineup_data?.lineup) {
        alert('No lineup found to regenerate');
        return;
      }

      const originalLineup = selectedLineup.lineup_data.lineup;
      const originalPlayerNames = new Set();
      
      originalLineup.forEach(line => {
        originalPlayerNames.add(line.team1.deuce.name);
        originalPlayerNames.add(line.team1.ad.name);
        originalPlayerNames.add(line.team2.deuce.name);
        originalPlayerNames.add(line.team2.ad.name);
      });

      const allPlayers = [...regularPlayers, ...substitutePlayers];
      const originalPlayerObjects = allPlayers.filter(p => originalPlayerNames.has(p.name));
      const playerIds = originalPlayerObjects.map(p => p.id);
      
      if (playerIds.length < 4) {
        alert('Need at least 4 players to regenerate lineup');
        return;
      }

      const currentWeek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
      const history = await lineupGenerator.getPairingHistory(currentRotation, 10);
      
      const result = await lineupGenerator.generateOptimalLineup(
        currentRotation, playerIds, currentWeek, history
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
                  <div class="player">${line.team1.deuce.name} (Deuce)</div>
                  <div class="player">${line.team1.ad.name} (Ad)</div>
                </div>
                <div class="team">
                  <div class="team-header">Team 2</div>
                  <div class="player">${line.team2.deuce.name} (Deuce)</div>
                  <div class="player">${line.team2.ad.name} (Ad)</div>
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

  // Effects
  useEffect(() => {
    loadRotations();
  }, [loadRotations]);

  useEffect(() => {
    if (currentRotation) {
      loadPlayers(currentRotation);
    }
  }, [currentRotation, loadPlayers]);

  // Loading/Error states
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
      <Header 
        rotations={rotations}
        currentRotation={currentRotation}
        setCurrentRotation={setCurrentRotation}
        getCurrentRotation={getCurrentRotation}
      />

      <div className="bg-white rounded-lg shadow-lg p-6">
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === 'lineup' && (
          <LineupGenerator
            regularPlayers={regularPlayers}
            substitutePlayers={substitutePlayers}
            availableRegular={availableRegular}
            availableSubstitutes={availableSubstitutes}
            setAvailableRegular={setAvailableRegular}
            setAvailableSubstitutes={setAvailableSubstitutes}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            upcomingDates={upcomingDates}
            currentLineup={currentLineup}
            generating={generating}
            togglePlayerAvailability={togglePlayerAvailability}
            generateLineup={generateLineup}
            saveLineup={saveLineup}
            formatDateDisplay={formatDateDisplay}
            getCurrentRotation={getCurrentRotation}
          />
        )}

        {activeTab === 'view' && (
          <LineupViewer
            savedLineups={savedLineups}
            selectedViewDate={selectedViewDate}
            setSelectedViewDate={setSelectedViewDate}
            editMode={editMode}
            setEditMode={setEditMode}
            editedLineup={editedLineup}
            setEditedLineup={setEditedLineup}
            isRegenerating={isRegenerating}
            formatDateDisplay={formatDateDisplay}
            formatDateDisplayLong={formatDateDisplayLong}
            isPastDate={isPastDate}
            handleRegenerateLineup={handleRegenerateLineup}
            handleSaveEdits={handleSaveEdits}
            handleDeleteLineup={handleDeleteLineup}
            handlePrintLineup={handlePrintLineup}
            getCurrentRotation={getCurrentRotation}
          />
        )}

        {activeTab === 'manage' && (
          <PlayerManagement
            regularPlayers={regularPlayers}
            substitutePlayers={substitutePlayers}
            availableRegular={availableRegular}
            availableSubstitutes={availableSubstitutes}
            editingPlayer={editingPlayer}
            showAddForm={showAddForm}
            addingType={addingType}
            setEditingPlayer={setEditingPlayer}
            setShowAddForm={setShowAddForm}
            setAddingType={setAddingType}
            togglePlayerAvailability={togglePlayerAvailability}
            addPlayer={addPlayer}
            editPlayer={editPlayer}
            deletePlayer={deletePlayer}
          />
        )}
      </div>
    </div>
  );
};

export default MatchNanny;