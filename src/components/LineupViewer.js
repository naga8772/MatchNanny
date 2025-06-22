// src/components/LineupViewer.js
import React from 'react';

const LineupViewer = ({
  savedLineups,
  selectedViewDate,
  setSelectedViewDate,
  editMode,
  setEditMode,
  editedLineup,
  setEditedLineup,
  isRegenerating,
  formatDateDisplay,
  formatDateDisplayLong,
  isPastDate,
  handleRegenerateLineup,
  handleSaveEdits,
  handleDeleteLineup,
  handlePrintLineup,
  getCurrentRotation
}) => {
  
  return (
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
                              onClick={() => setEditMode(true)}
                              className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center space-x-1 text-sm"
                            >
                              ✏️ <span>Edit</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={handleRegenerateLineup}
                                disabled={isRegenerating}
                                className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm disabled:bg-gray-400"
                              >
                                <span>{isRegenerating ? 'Generating...' : 'Regenerate'}</span>
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

                  {/* Lineup Details */}
                  {(() => {
                    const selectedLineup = savedLineups.find(l => l.match_date === selectedViewDate);
                    const displayLineup = editedLineup || selectedLineup?.lineup_data?.lineup;
                    
                    if (!displayLineup || displayLineup.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          No lineup data available
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {displayLineup.map((line, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                              <h4 className="font-semibold text-gray-900">Line {line.line}</h4>
                            </div>
                            <div className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Team 1 */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <div className="text-sm font-medium text-blue-800 mb-2">Team 1</div>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="font-medium text-gray-900">{line.team1.deuce.name}</div>
                                        <div className="text-sm text-gray-600">
                                          {line.team1.deuce.strength?.toUpperCase() || 'MEDIUM'} • Deuce Side
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between">
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
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <div className="text-sm font-medium text-green-800 mb-2">Team 2</div>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="font-medium text-gray-900">{line.team2.deuce.name}</div>
                                        <div className="text-sm text-gray-600">
                                          {line.team2.deuce.strength?.toUpperCase() || 'MEDIUM'} • Deuce Side
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between">
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
  );
};

export default LineupViewer;