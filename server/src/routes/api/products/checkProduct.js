// server/src/routes/api/products/checkProduct.js
// Route for GET /products/checkProduct?barcode=||productName=

const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const fs = require('fs');
const path = require('path');
const Fuse = require('fuse.js');
const { parseRecallResults } = require('../../../utils/parseRecallResults');

// Load the recall dataset once (for faster access)
// let recallsData = [];
// const loadRecallData = () => {
//   try {
//     const dataPath = path.resolve(__dirname, '../../../../database/HCRSAMOpenData.json');
//     const data = fs.readFileSync(dataPath, 'utf8');
//     recallsData = JSON.parse(data);
//     console.log(`Loaded ${recallsData.length} recall records`);
//     return recallsData;
//   } catch (err) {
//     logger.error(err, 'ERROR loading recall data');
//   }
// };

// Search recalls data for a product name
const searchHealthCanadaRecalls = async (productName) => {
  const baseUrl = 'https://recalls-rappels.canada.ca/en/search/site?search_api_fulltext=';
  const searchUrl = `${baseUrl}${encodeURIComponent(productName)}`;

  try {
    const recallsRes = await fetch(searchUrl);
    const html = await recallsRes.text();

    return parseRecallResults(html);
  } catch (err) {
    logger.error(err, `ERROR fetching Health Canada recalls for ${productName}`);
    return [];
  }
};

// GET /products/checkProduct?barcode=||productName= - Check a product to see if it has been recalled
module.exports.checkProduct = async (req, res) => {
  // const recallsData = loadRecallData();
  const { barcode, productName } = req.query;
  if (!barcode && !productName) {
    return res.status(400).send(createErrorResponse(400, 'Provide barcode or product name'));
  }

  try {
    let product;

    // Get the product name from the barcode
    if (!productName) {
      const barcodeRes = await fetch(
        `https://api.barcodelookup.com/v3/products?barcode=${barcode}&formatted=y&key=${process.env.BARCODE_SCANNER_API_KEY}`
      );

      if (barcodeRes.statusText !== 'OK') {
        return res.status(400).send(createErrorResponse(400, 'Invalid barcode'));
      }

      const data = await barcodeRes.json();
      console.log('data:', data.products);
      product = data.products[0]?.title || null;
      console.log('productName:', product);
      if (!product) {
        return res.status(404).send(createErrorResponse(404, 'Product not found for this barcode'));
      }
    } else {
      product = productName;
    }

    // Scraping the recall data from the Health Canada website
    const recalls = await searchHealthCanadaRecalls(product);
    console.log('Recalls:', recalls);

    // Filter Recalls for baby-related products
    // const babyRecalls = recallsData.filter(
    //   (item) =>
    //     item.Category?.toLowerCase().includes('baby') ||
    //     item.Category?.toLowerCase().includes('child') ||
    //     item.Product?.toLowerCase().includes('baby') ||
    //     item.Product?.toLowerCase().includes('child') ||
    //     item.Title?.toLowerCase().includes('baby') ||
    //     item.Title?.toLowerCase().includes('child')
    // );

    // Use Fuzzy search for best match
    // const fuse = new Fuse(babyRecalls, {
    //   keys: ['Title', 'Product'],
    //   threshold: 0.3,
    // });
    // console.log('Product Name', product);
    // const fuzzyMatches = fuse.search(product).map((result) => result.item);

    // Provide recommendations if no exact match
    // let recommendations = [];
    // if (fuzzyMatches.length === 0) {
    //   const similarRecalls = new Fuse(babyRecalls, {
    //     keys: ['Title', 'Product'],
    //     threshold: 0.5,
    //   });
    //   recommendations = similarRecalls
    //     .search(product)
    //     .map((result) => result.item)
    //     .slice(0, 3);
    // }

    // let safetyLevel = fuzzyMatches.length > 0 ? 'Recalled' : 'Safe';

    res.json({
      barcode,
      product: product,
      recalls,
    });
  } catch (err) {
    logger.error(
      err,
      `ERROR in GET /products/checkProduct?barcode=${barcode}||productName=${product}`
    );
    res
      .status(500)
      .send(createErrorResponse(500, `Failed to fetch Product Safety API: ${err.message}`));
  }
};
