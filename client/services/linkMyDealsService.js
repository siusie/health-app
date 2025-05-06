// client/services/linkMyDealsService.js

/**
 * Service for handling LinkMyDeals Coupon API data
 * Uses a local JSON file to avoid excessive API calls
 */
class LinkMyDealsService {
    constructor() {
      this.baseUrl = 'http://feed.linkmydeals.com/getOffers/';
      this.apiKey = process.env.NEXT_PUBLIC_LINKMYDEALS_API_KEY;
      this.lastExtractTimestamp = null;
      this.cachedOffers = null;
      this.lastUpdate = null;
    }
  
    /**
     * Gets offers from the local data file
     * In a production environment, this could be replaced with a server-side call
     * that updates the data file periodically
     * @returns {Promise<Object>} The offers data
     */
    async getOffersFromFile() {
      try {
        // In a real implementation, this would be a server-side API call
        // that reads from the file or updates it if needed
        const response = await fetch('/data/coupons-discounts.json');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch offers data: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        this.lastUpdate = new Date(data.last_updated);
        return data;
      } catch (error) {
        console.error('Error fetching offers from file:', error);
        throw error;
      }
    }
  
    /**
     * Direct API call to LinkMyDeals (limited usage)
     * Only used when explicitly refreshing the cache
     * @param {string} format - Response format ('json' or 'csv')
     * @returns {Promise<Object>} The API response
     */
    async callLinkMyDealsApi(format = 'json', incremental = false) {
      try {
        let url = `${this.baseUrl}?API_KEY=${this.apiKey}&format=${format}`;
        
        if (incremental) {
          const timestamp = this.lastExtractTimestamp || Math.floor(Date.now() / 1000);
          url += `&incremental=1&last_extract=${timestamp}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch offers: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        this.lastExtractTimestamp = Math.floor(Date.now() / 1000);
        
        return data;
      } catch (error) {
        console.error('Error calling LinkMyDeals API:', error);
        throw error;
      }
    }
  
    /**
     * Transform LinkMyDeals offer to match our application's coupon format
     * @param {Object} offer - Original offer from LinkMyDeals API
     * @returns {Object} Transformed offer matching our app's format
     */
    transformOffer(offer) {
      return {
        id: offer['LMD ID'],
        product_name: offer['Title'] || offer['Offer Text'],
        discount_description: offer['Description'] || '',
        discount_code: offer['Coupon Code'] || '',
        discount_amount: offer['Offer Value'] || '',
        discount_symbol: offer['Offer'] && offer['Offer'].includes('Percentage') ? '%' : '$',
        store: offer['Store'] || '',
        city: '', // LinkMyDeals doesn't have city information
        image_url: offer['Image'] || '',
        expiration_date: offer['End Date'] || '',
        is_featured: offer['Featured'] === 'Yes',
        affiliate_link: offer['Affiliate Link'] || '',
        url: offer['URL'] || offer['Merchant Homepage'] || '',
        type: offer['Type'] || '',
        categories: offer['Categories'] || '',
        start_date: offer['Start Date'] || '',
        end_date: offer['End Date'] || '',
      };
    }
  
    /**
     * Fetch and transform offers for our application
     * Uses the cached data file by default
     * @param {boolean} forceRefresh - Whether to force an API call to refresh data
     * @returns {Promise<Array>} Transformed offers
     */
    async getOffers(forceRefresh = false) {
      try {
        // If we already have cached offers and don't need to refresh, return them
        if (this.cachedOffers && !forceRefresh) {
          return this.cachedOffers;
        }
        
        // In a production environment, the forceRefresh would trigger a server-side
        // process to update the JSON file. For this demo, we'll just read the static file.
        let response;
        
        if (forceRefresh && this.apiKey) {
          // This would be a real API call in production and would update the data file
          console.warn('IMPORTANT: Making real API call to LinkMyDeals (limited usage)');
          response = await this.callLinkMyDealsApi('json', false);
        } else {
          // Use local file
          response = await this.getOffersFromFile();
        }
        
        if (!response || !response.offers) {
          return [];
        }
        
        // Transform and cache the offers
        this.cachedOffers = response.offers.map(offer => this.transformOffer(offer));
        return this.cachedOffers;
      } catch (error) {
        console.error('Error processing offers:', error);
        return [];
      }
    }
  
    /**
     * Get the last update timestamp
     * @returns {Date|null} The last update date
     */
    getLastUpdateTime() {
      return this.lastUpdate;
    }
  }
  
  // Export a singleton instance
  const linkMyDealsService = new LinkMyDealsService();
  export default linkMyDealsService;