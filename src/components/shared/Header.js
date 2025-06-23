// src/components/shared/Header.js
import React from 'react';

const Header = ({ 
  rotations, 
  currentRotation, 
  setCurrentRotation, 
  getCurrentRotation 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-4xl">🎾</span>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">MatchNanny</h1>
            <p className="text-gray-600 font-bold text-blue-800">Brookhaven Racquet Club</p>
            <p className="text-sm text-gray-500">Professional Adult Supervision for Tennis Teams - Now Live! 🚀</p>
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
    </div>
  );
};

export default Header;