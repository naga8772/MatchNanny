// src/components/PlayerManagement.js
import React from 'react';
import PlayerForm from './PlayerForm';

const PlayerManagement = ({
  regularPlayers,
  substitutePlayers,
  availableRegular,
  availableSubstitutes,
  editingPlayer,
  showAddForm,
  addingType,
  setEditingPlayer,
  setShowAddForm,
  setAddingType,
  togglePlayerAvailability,
  addPlayer,
  editPlayer,
  deletePlayer
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
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Regular Players Management */}
      <div>
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
      <div>
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

export default PlayerManagement;