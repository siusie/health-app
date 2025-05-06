// scripts/refresh-linkmydeals-cache.js
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

// Configuration
const API_KEY = process.env.NEXT_PUBLIC_LINKMYDEALS_API_KEY;
const API_URL = 'https://feed.linkmydeals.com/getOffers/';
const DATA_FILE_PATH = path.join(process.cwd(), 'public', 'data', 'coupons-discounts.json');

// Read the current data file to get the last extract timestamp
const getCurrentData = () => {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE_PATH, 'utf8'));
      return data;
    }
  } catch (error) {
    console.error('Error reading current data file:', error);
  }
  
  return null;
};

// Save data to the JSON file
const saveData = (data) => {
  try {
    // Ensure the directory exists
    const dirPath = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
    console.log(`Data saved to ${DATA_FILE_PATH}`);
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
};

// Fetch offers from LinkMyDeals API
const fetchOffers = async (incremental = true) => {
  try {
    if (!API_KEY) {
      throw new Error('API key not found. Make sure NEXT_PUBLIC_LINKMYDEALS_API_KEY is set in .env.local');
    }

    // Get current data and extract timestamp
    const currentData = getCurrentData();
    let lastExtract = null;
    
    if (currentData && incremental) {
      // Extract timestamp from the last_updated field
      const lastUpdateDate = new Date(currentData.last_updated);
      lastExtract = Math.floor(lastUpdateDate.getTime() / 1000);
    }
    
    // Build URL
    let url = `${API_URL}?API_KEY=${API_KEY}&format=json`;
    
    if (incremental && lastExtract) {
      url += `&incremental=1&last_extract=${lastExtract}`;
      console.log(`Fetching incremental updates since ${new Date(lastExtract * 1000).toLocaleString()}`);
    } else {
      console.log('Fetching full feed (all offers)');
    }
    
    // Make the API call using native fetch
    console.log(`Making API request to: ${url.replace(API_KEY, '***API_KEY***')}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.result) {
      throw new Error('API returned unsuccessful result');
    }
    
    console.log(`Received ${data.offers ? data.offers.length : 0} offers from API`);
    
    // If this is an incremental update, merge with existing data
    if (incremental && currentData && data.offers) {
      console.log('Merging incremental updates with existing data...');
      
      // Create a map of existing offers by ID
      const existingOffersMap = {};
      currentData.offers.forEach(offer => {
        existingOffersMap[offer['LMD ID']] = offer;
      });
      
      // Process each new/updated offer
      data.offers.forEach(offer => {
        const offerId = offer['LMD ID'];
        
        // If status is 'suspended', remove the offer
        if (offer.Status === 'suspended') {
          delete existingOffersMap[offerId];
        } else {
          // Otherwise update or add the offer
          existingOffersMap[offerId] = offer;
        }
      });
      
      // Convert map back to array
      const mergedOffers = Object.values(existingOffersMap);
      
      // Create the updated data structure
      const updatedData = {
        last_updated: new Date().toISOString(),
        total_offers: mergedOffers.length,
        offers: mergedOffers
      };
      
      return saveData(updatedData);
    } else {
      // For full updates, just save the new data
      const newData = {
        last_updated: new Date().toISOString(),
        total_offers: data.offers ? data.offers.length : 0,
        offers: data.offers || []
      };
      
      return saveData(newData);
    }
  } catch (error) {
    console.error('Error fetching offers:', error);
    return false;
  }
};

// Create a fallback solution if API call fails
const createSampleData = () => {
  console.log('Creating sample data as fallback...');
  
  const sampleData = {
    last_updated: new Date().toISOString(),
    total_offers: 10,
    offers: [
      {
        "LMD ID": "1001",
        "Status": "active",
        "Offer Text": "Get 20% off on all baby products",
        "Title": "20% Off Baby Essentials",
        "Description": "Use this coupon to get 20% off on all baby essentials including diapers, wipes, and formula. Valid until April 30, 2024.",
        "Type": "Coupon Code",
        "Coupon Code": "BABY20",
        "Terms and Conditions": "Cannot be combined with other offers. Valid for online purchases only.",
        "Offer": "Percentage Off",
        "Offer Value": "20",
        "Store": "BabyFirst",
        "Merchant Homepage": "https://www.babyfirst.com",
        "Categories": "Baby Products, Diapers, Health",
        "Featured": "Yes",
        "URL": "https://www.babyfirst.com/promotions/spring-sale",
        "Image": "https://example.com/images/babyfirst-promo.jpg",
        "Affiliate Link": "https://www.example-affiliate.com/track?store=babyfirst&coupon=BABY20",
        "Publisher Exclusive": "No",
        "Start Date": "2024-04-01",
        "End Date": "2024-04-30"
      },
      // Add the rest of the sample data offers here
      // ... (would include the rest of the sample offers)
    ]
  };
  
  return saveData(sampleData);
};

// Main execution
(async () => {
  console.log('Starting LinkMyDeals cache refresh...');
  
  // Check if data file exists
  const dataExists = fs.existsSync(DATA_FILE_PATH);
  
  // If data file doesn't exist, do a full fetch, otherwise do incremental
  try {
    const success = await fetchOffers(dataExists);
    
    if (success) {
      console.log('Cache refresh completed successfully!');
    } else {
      console.error('Cache refresh failed.');
      
      // If the API call failed and we don't have existing data, create sample data
      if (!dataExists) {
        console.log('Creating sample data since API call failed...');
        await createSampleData();
      }
      
      process.exit(1);
    }
  } catch (error) {
    console.error('Error during cache refresh:', error);
    
    // If an error occurred and we don't have existing data, create sample data
    if (!dataExists) {
      console.log('Creating sample data due to error...');
      await createSampleData();
    }
    
    process.exit(1);
  }
})();