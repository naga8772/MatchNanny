// src/components/LineupGenerator.js
import React from 'react';

const LineupGenerator = ({
  regularPlayers,
  substitutePlayers,
  availableRegular,
  availableSubstitutes,
  setAvailableRegular,
  setAvailableSubstitutes,
  selectedDate,
  setSelectedDate,
  upcomingDates,
  currentLineup,
  generating,
  togglePlayerAvailability,
  generateLineup,
  saveLineup,
  formatDateDisplay,
  getCurrentRotation
}) => {

  // Helper function for strength colors
  const getStrengthColor = (strength) => {
    switch(strength) {
      case 'High': return 'text-red-600';
      case 'Medium': return 'text-yellow-600'; 
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // Render player card for availability selection
  const renderPlayerCard = (player, isAvailable, isSubstitute = false) => (
    <div
      key={player.id}
      className={`p-3 border rounded-lg transition-all cursor-pointer ${
        isAvailable
          ? 'bg-blue-50 border-blue-300 shadow-md'
          : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}
      onClick={() => togglePlayerAvailability(player.id, isSubstitute)}
    >
      <div className="flex items-center space-x-2">
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
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-2">
              Select Match Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Choose a date...</option>
              {upcomingDates.map(dateOption => (
                <option key={dateOption.date} value={dateOption.date}>
                  {dateOption.display} at {dateOption.time}
                </option>
              ))}
            </select>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-700">
              {getCurrentRotation()?.schedule}
            </div>
            <div className="text-xs text-blue-600 italic">
              {selectedDate && `Match: ${formatDateDisplay(selectedDate)}`}
            </div>
          </div>
        </div>
      </div>

      {/* Player Availability Selection */}
      {regularPlayers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              👥 Regular Players ({availableRegular.size}/{regularPlayers.length} available)
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setAvailableRegular(new Set(regularPlayers.map(p => p.id)))}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
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

      {/* Substitute Players Availability */}
      {substitutePlayers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-orange-800 flex items-center">
              🔄 Substitute Players ({availableSubstitutes.size}/{substitutePlayers.length} available)
            </h2>
            <div className="flex space-x-2">
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
        <div className="flex justify-center space-x-4">
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
    </div>
  );
};

export default LineupGenerator;