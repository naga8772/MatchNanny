// src/utils/dateHelpers.js

/**
 * Safely parse dates without timezone issues
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date display
 */
export const formatDateDisplay = (dateString) => {
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

/**
 * Format date for long display
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} Long formatted date display
 */
export const formatDateDisplayLong = (dateString) => {
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

/**
 * Determine if date is in the past
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} True if date is in the past
 */
export const isPastDate = (dateString) => {
  if (!dateString) return false;
  
  const [year, month, day] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

/**
 * Generate upcoming dates for a rotation
 * @param {object} rotation - Rotation object with day_of_week and start_time
 * @returns {array} Array of date objects with date, display, and time
 */
export const generateUpcomingDates = (rotation) => {
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
};

/**
 * Get today's date formatted for display
 * @returns {string} Today's date formatted
 */
export const getTodayFormatted = () => {
  return new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};