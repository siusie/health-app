import { parseISO, format, isWithinInterval } from "date-fns";

/**
 * Find the optimal date range for a dataset based on time range
 * @param {Array} data - The dataset to analyze
 * @param {string} currentEndDate - Current end date (YYYY-MM-DD)
 * @param {string} timeRange - "week" or "month"
 * @param {string} minDate - Minimum allowed date
 * @param {string} maxDate - Maximum allowed date
 * @returns {Object} - Object with optimized start and end dates
 */
export function findOptimalDateRange(data, currentEndDate, timeRange, minDate, maxDate) {
  if (!Array.isArray(data) || data.length === 0) {
    return { start: minDate || "", end: currentEndDate || maxDate || "" };
  }
  
  // 1. Sort data by date (oldest to newest for checking range)
  const sortedData = [...data].sort((a, b) => {
    const dateA = a.date || a.timestamp || a.created_at || a.measurement_date || '';
    const dateB = b.date || b.timestamp || b.created_at || b.measurement_date || '';
    const parsedA = parseISO(dateA.includes('T') ? dateA.split('T')[0] : dateA);
    const parsedB = parseISO(dateB.includes('T') ? dateB.split('T')[0] : dateB);
    return parsedA - parsedB; // Oldest first
  });
  
  // 2. Extract dates and filter out invalid ones
  const allDates = sortedData
    .map(item => {
      const dateStr = item.date || item.timestamp || item.created_at || item.measurement_date || '';
      if (!dateStr) return null;
      const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const parsed = parseISO(cleanDate);
      return !isNaN(parsed) ? parsed : null;
    })
    .filter(date => date !== null);
  
  if (allDates.length === 0) {
    return { start: minDate || "", end: currentEndDate || maxDate || "" };
  }
  
  // 3. Get date range
  const oldestDate = allDates[0];
  const newestDate = allDates[allDates.length - 1];
  
  const parsedEndDate = parseISO(currentEndDate);
  let targetEndDate = !isNaN(parsedEndDate) ? parsedEndDate : newestDate;
  
  // Make sure end date doesn't exceed newest logged date or max allowed date
  if (maxDate && targetEndDate > parseISO(maxDate)) {
    targetEndDate = parseISO(maxDate);
  }
  
  // 4. Calculate appropriate start date based on time range
  const daysToSubtract = timeRange === "week" ? 6 : 29;
  let targetStartDate = new Date(targetEndDate);
  targetStartDate.setDate(targetStartDate.getDate() - daysToSubtract);
  
  // 5. Check if we have more data available at the beginning of the range
  if (targetStartDate > oldestDate) {
    // We have older data, so check if we can expand the range to show more data
    const maxPossibleEndDate = new Date(oldestDate);
    maxPossibleEndDate.setDate(maxPossibleEndDate.getDate() + daysToSubtract);
    
    // If max possible end date is newer than current end date, use it
    // This ensures we show as much data as possible
    if (maxPossibleEndDate > targetEndDate) {
      targetStartDate = oldestDate;
      const daysToAdd = timeRange === "week" ? 6 : 29;
      targetEndDate = new Date(oldestDate);
      targetEndDate.setDate(targetEndDate.getDate() + daysToAdd);
      
      // Ensure end date doesn't exceed max allowed
      if (maxDate && targetEndDate > parseISO(maxDate)) {
        targetEndDate = parseISO(maxDate);
      }
    }
  }
  
  // 6. Ensure start date doesn't go below minimum allowed
  if (minDate && targetStartDate < parseISO(minDate)) {
    targetStartDate = parseISO(minDate);
  }
  
  return {
    start: format(targetStartDate, "yyyy-MM-dd"),
    end: format(targetEndDate, "yyyy-MM-dd")
  };
}

/**
 * Determines if a dataset has enough data points for meaningful analysis
 * @param {Array} data - The dataset to analyze
 * @param {string} timeRange - "week" or "month" 
 * @param {string} dataType - "feed", "stool", or "growth"
 * @returns {boolean} - Whether there's enough data
 */
export function hasEnoughDataPoints(data, timeRange, dataType = "feed") {
  if (!Array.isArray(data) || data.length === 0) return false;
  
  // Minimum data points needed varies by chart type and time range
  let minimumPoints;
  
  switch(dataType) {
    case "feed":
      minimumPoints = timeRange === "week" ? 3 : 7;
      break;
    case "stool":
      minimumPoints = 7; // Always at least 7 for stool data
      break;
    case "growth":
      minimumPoints = 3; // At least 3 measurements for growth trends
      break;
    default:
      minimumPoints = timeRange === "week" ? 3 : 7;
  }
  
  // For chart data that might have a different structure
  // Count the number of unique dates with data
  if (data[0] && (data[0].date || data[0].timestamp)) {
    const uniqueDates = new Set();
    data.forEach(item => {
      const dateStr = item.date || item.timestamp || item.created_at || item.measurement_date;
      if (dateStr) uniqueDates.add(dateStr.split('T')[0]);
    });
    return uniqueDates.size >= minimumPoints;
  }
  
  return data.length >= minimumPoints;
}

/**
 * Validates and corrects a date range to ensure it's within bounds
 * @param {string} start - Start date string (YYYY-MM-DD)
 * @param {string} end - End date string (YYYY-MM-DD)
 * @param {string} minDate - Minimum allowed date
 * @param {string} maxDate - Maximum allowed date
 * @param {string} timeRange - "week" or "month"
 * @returns {Object} - Object with validated start and end dates
 */
export function validateDateRange(start, end, minDate, maxDate, timeRange) {
  // Handle empty inputs safely
  if (!start || !end || !minDate || !maxDate) {
    return {
      start: minDate || "",
      end: maxDate || ""
    };
  }
  
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  const minLogDate = parseISO(minDate);
  const maxLogDate = parseISO(maxDate);
  
  // Ensure all dates are valid
  if (isNaN(startDate) || isNaN(endDate) || isNaN(minLogDate) || isNaN(maxLogDate)) {
    console.error("Invalid date detected in validateDateRange");
    return {
      start: minDate,
      end: maxDate
    };
  }
  
  let validStart = startDate;
  let validEnd = endDate;
  
  // Ensure start date isn't before minLoggedDate
  if (startDate < minLogDate) {
    validStart = minLogDate;
  }
  
  // Ensure end date isn't after maxLoggedDate
  if (endDate > maxLogDate) {
    validEnd = maxLogDate;
  }
  
  // Ensure start date isn't after end date
  if (validStart > validEnd) {
    validStart = new Date(validEnd);
    validStart.setDate(validStart.getDate() - (timeRange === "week" ? 6 : 29));
    
    // If this puts us before minLoggedDate, adjust again
    if (validStart < minLogDate) {
      validStart = minLogDate;
    }
  }
  
  return {
    start: format(validStart, "yyyy-MM-dd"),
    end: format(validEnd, "yyyy-MM-dd")
  };
}

/**
 * Compares two dates for sorting (newest first)
 * @param {Object} a - First data object
 * @param {Object} b - Second data object
 * @returns {number} - Comparison result
 */
export function compareDates(a, b) {
  const dateA = a.date || a.timestamp || a.created_at || a.measurement_date || '';
  const dateB = b.date || b.timestamp || b.created_at || b.measurement_date || '';
  
  // If dates are exactly the same or one is missing, try using time as tie-breaker
  if (dateA === dateB || !dateA || !dateB) {
    const timeA = a.time || '';
    const timeB = b.time || '';
    return timeB.localeCompare(timeA); // Latest time first
  }
  
  // Convert to date objects for comparison
  const parsedA = parseISO(dateA);
  const parsedB = parseISO(dateB);
  
  // If both are valid dates, compare them (newest first)
  if (!isNaN(parsedA) && !isNaN(parsedB)) {
    return parsedB - parsedA;
  }
  
  // Fall back to string comparison if date parsing fails
  return dateB.localeCompare(dateA);
}

/**
 * Filters data array based on a date range
 * @param {Array} dataArray - The data to filter
 * @param {string} startDate - Start date string (YYYY-MM-DD)
 * @param {string} endDate - End date string (YYYY-MM-DD)
 * @param {string} timeRange - "week" or "month"
 * @returns {Array} - Filtered data array
 */
export function filterDataByRange(dataArray, startDate, endDate, timeRange = "month") {
  if (!startDate || !endDate || !Array.isArray(dataArray)) return [];
  
  // Parse the date range
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  // For week view, don't add the extra day; for month view, make end date inclusive
  const inclusiveEnd = timeRange === "week" ? end : new Date(end);
  if (timeRange !== "week") {
    inclusiveEnd.setDate(inclusiveEnd.getDate() + 1);
  }
  
  return dataArray.filter((item) => {
    // Get the date from various possible properties
    let dStr = item.date || item.timestamp || item.created_at || item.measurement_date;
    
    // Handle chart data objects which have a date property
    if (!dStr && item.date) {
      dStr = item.date;
    }
    
    if (!dStr) return false;
    
    // If date contains time information, strip it off
    if (dStr.includes('T')) {
      dStr = dStr.split('T')[0];
    }
    
    const d = parseISO(dStr);
    return d && !isNaN(d) && isWithinInterval(d, { start, end: inclusiveEnd });
  });
}

/**
 * Find the earliest and latest dates in any dataset
 * @param {Array} datasets - Array of datasets to analyze
 * @returns {Object} - Object with minDate and maxDate
 */
export function findDateRange(datasets) {
  const allDates = [];
  
  // Process each dataset
  datasets.forEach(dataset => {
    if (!Array.isArray(dataset)) return;
    
    // Extract dates from each item
    dataset.forEach(item => {
      const dateStr = item.date || item.timestamp || item.created_at || item.measurement_date;
      
      if (dateStr) {
        // Handle ISO date strings by removing time portion
        const cleanDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        const parsed = parseISO(cleanDateStr);
        
        if (!isNaN(parsed)) {
          allDates.push(parsed);
        }
      }
    });
  });
  
  // If we found any valid dates
  if (allDates.length > 0) {
    allDates.sort((a, b) => a - b); // Sort dates chronologically
    
    const earliest = allDates[0];
    const latest = allDates[allDates.length - 1];
    
    return {
      minDate: format(earliest, "yyyy-MM-dd"),
      maxDate: format(latest, "yyyy-MM-dd")
    };
  }
  
  return {
    minDate: "",
    maxDate: ""
  };
}

/**
 * Calculate start date based on end date and time range
 * @param {string} endDate - End date string (YYYY-MM-DD)
 * @param {string} timeRange - "week" or "month"
 * @param {string} minDate - Minimum possible date
 * @returns {string} - Calculated start date
 */
export function calculateStartDate(endDate, timeRange, minDate) {
  const parsedEndDate = parseISO(endDate);
  const startDate = new Date(parsedEndDate);
  
  // Subtract appropriate days based on timeRange
  timeRange === "week" 
    ? startDate.setDate(startDate.getDate() - 6)
    : startDate.setDate(startDate.getDate() - 29);
  
  // Ensure start date isn't before min date
  if (minDate && startDate < parseISO(minDate)) {
    return minDate;
  }
  
  return format(startDate, "yyyy-MM-dd");
}

/**
 * Get a user-friendly message about data availability
 * @param {string} dataType - "feed", "stool", or "growth"
 * @param {string} timeRange - "week" or "month"
 * @param {string} lastDate - The last logged date
 * @returns {string} - Informative message
 */
export function getDataAvailabilityMessage(dataType, timeRange, lastDate) {
  const formattedDate = lastDate ? format(parseISO(lastDate), "MMMM d, yyyy") : "N/A";
  
  let message = `Last ${dataType} record was logged on ${formattedDate}, but `;
  
  switch(dataType) {
    case "feed":
      message += timeRange === "week" 
        ? "at least 3 days with feeding logs are needed for weekly analysis."
        : "at least 7 days with feeding logs are needed for monthly analysis.";
      break;
    case "stool":
      message += "at least 7 stool logs are needed for accurate analysis.";
      break;
    case "growth":
      message += "at least 3 growth measurements are needed for accurate analysis.";
      break;
    default:
      message += "not enough records are available to display this view.";
  }
  
  return message;
}

/**
 * Get the most recent date from a dataset
 * @param {Array} data - The dataset to analyze
 * @returns {string} - The most recent date or empty string
 */
export function getLastLoggedDate(data) {
  if (!Array.isArray(data) || data.length === 0) return "";
  
  // Sort data by date (newest first)
  const sorted = [...data].sort(compareDates);
  
  // Get the date from the most recent item
  const mostRecent = sorted[0];
  const dateStr = mostRecent.date || mostRecent.timestamp || mostRecent.created_at || mostRecent.measurement_date || '';
  
  if (!dateStr) return "";
  
  // Return just the date portion without time
  return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
}

/**
 * Get the most recent date from a dataset within a specific date range
 * @param {Array} data - The dataset to analyze
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {string} - The most recent date in the range or empty string
 */
export function getLastLoggedDateInRange(data, startDate, endDate) {
  if (!Array.isArray(data) || data.length === 0 || !startDate || !endDate) return "";
  
  // Parse the date range
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  // Filter data to the specified range
  const filteredData = data.filter(item => {
    // Get the date from various possible properties
    let dStr = item.date || item.timestamp || item.created_at || item.measurement_date || '';
    
    if (!dStr) return false;
    
    // If date contains time information, strip it off
    if (dStr.includes('T')) {
      dStr = dStr.split('T')[0];
    }
    
    const d = parseISO(dStr);
    return d && !isNaN(d) && d >= start && d <= end;
  });
  
  if (filteredData.length === 0) return "";
  
  // Sort filtered data by date (newest first)
  const sorted = [...filteredData].sort(compareDates);
  
  // Get the date from the most recent item
  const mostRecent = sorted[0];
  const dateStr = mostRecent.date || mostRecent.timestamp || mostRecent.created_at || mostRecent.measurement_date || '';
  
  // Return just the date portion without time
  return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
}