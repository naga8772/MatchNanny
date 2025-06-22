// src/utils/playerHelpers.js

/**
 * Get color class for player strength display
 * @param {string} strength - Player strength (High, Medium, Low)
 * @returns {string} Tailwind CSS color class
 */
export const getStrengthColor = (strength) => {
  switch (strength) {
    case "High": return "text-red-600";
    case "Medium": return "text-yellow-600";
    case "Low": return "text-green-600";
    default: return "text-gray-600";
  }
};

/**
 * Filter players by role
 * @param {array} players - Array of player objects
 * @param {string} role - Role to filter by ('Substitute' or others)
 * @returns {object} Object with regular and substitute player arrays
 */
export const filterPlayersByRole = (players) => {
  const regular = players.filter(p => p.role !== 'Substitute');
  const substitutes = players.filter(p => p.role === 'Substitute');
  
  return { regular, substitutes };
};

/**
 * Toggle player availability in a Set
 * @param {Set} availableSet - Current Set of available player IDs
 * @param {string} playerId - Player ID to toggle
 * @returns {Set} New Set with toggled availability
 */
export const togglePlayerInSet = (availableSet, playerId) => {
  const newSet = new Set(availableSet);
  if (newSet.has(playerId)) {
    newSet.delete(playerId);
  } else {
    newSet.add(playerId);
  }
  return newSet;
};

/**
 * Get all player IDs from an array
 * @param {array} players - Array of player objects
 * @returns {Set} Set of all player IDs
 */
export const getAllPlayerIds = (players) => {
  return new Set(players.map(p => p.id));
};

/**
 * Clear all player IDs (return empty Set)
 * @returns {Set} Empty Set
 */
export const clearAllPlayerIds = () => {
  return new Set();
};

/**
 * Validate player data for form submission
 * @param {object} playerData - Player data object
 * @returns {object} Validation result with isValid and errors
 */
export const validatePlayerData = (playerData) => {
  const errors = [];
  
  if (!playerData.name?.trim()) {
    errors.push('Name is required');
  }
  
  if (playerData.phone && !/^\(\d{3}\)\s\d{3}-\d{4}$/.test(playerData.phone)) {
    // Basic phone format validation (optional)
    // errors.push('Phone should be in format (555) 123-4567');
  }
  
  if (playerData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(playerData.email)) {
    errors.push('Invalid email format');
  }
  
  const validStrengths = ['Low', 'Medium', 'High'];
  if (!validStrengths.includes(playerData.strength)) {
    errors.push('Invalid strength level');
  }
  
  const validStyles = ['Right Handed', 'Left Handed'];
  if (!validStyles.includes(playerData.style)) {
    errors.push('Invalid playing style');
  }
  
  const validPreferences = ['Both sides', 'Deuce side', 'Ad side'];
  if (!validPreferences.includes(playerData.preference)) {
    errors.push('Invalid position preference');
  }
  
  const validRoles = ['Player', 'Captain', 'Co-Captain', 'Substitute'];
  if (!validRoles.includes(playerData.role)) {
    errors.push('Invalid role');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Format phone number as user types
 * @param {string} input - Raw phone input
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (input) => {
  // Remove all non-digits
  const digits = input.replace(/\D/g, '');
  
  // Format as (555) 123-4567
  if (digits.length >= 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  } else if (digits.length >= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length >= 3) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else if (digits.length > 0) {
    return `(${digits}`;
  }
  
  return '';
};

/**
 * Get sample players data for testing
 * @returns {array} Array of sample player objects
 */
export const getSamplePlayers = () => [
  { name: "Carrie Currier", phone: "", strength: "Medium", style: "Right Handed", preference: "Both sides", role: "Captain" },
  { name: "Naganand Jagadeesh", phone: "", strength: "Medium", style: "Right Handed", preference: "Both sides", role: "Player" },
  { name: "Brian Schwarzlose", phone: "", strength: "High", style: "Right Handed", preference: "Both sides", role: "Player" },
  { name: "Don Buford", phone: "", strength: "Low", style: "Right Handed", preference: "Deuce side", role: "Player" },
  { name: "Jacinto Rivera", phone: "", strength: "Medium", style: "Right Handed", preference: "Both sides", role: "Player" },
  { name: "Jeff LaSelle", phone: "", strength: "Medium", style: "Right Handed", preference: "Ad side", role: "Player" },
  { name: "Mike Johnson", phone: "", strength: "Medium", style: "Right Handed", preference: "Both sides", role: "Substitute" },
  { name: "Sarah Williams", phone: "", strength: "Low", style: "Left Handed", preference: "Ad side", role: "Substitute" }
];