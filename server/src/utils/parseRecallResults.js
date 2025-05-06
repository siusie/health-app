const cheerio = require('cheerio');

const parseRecallResults = (html) => {
  const $ = cheerio.load(html);
  const recalls = [];

  const categoryMap = {
    'food.svg': 'Food',
    'health.svg': 'Health',
    'product.svg': 'Product',
    'transport.svg': 'Transport',
  };

  $('.view-content .search-result.views-row').each((i, element) => {
    const $el = $(element);
    const title = $el.find('.homepage-recent a').first().text().trim();
    const url = $el.find('.homepage-recent a').attr('href');
    const type = $el.find('.label-danger').text().trim();
    const arType = $el.find('.ar-type').text().trim();
    const date = arType.split('|')[1]?.trim();

    const imgSrc = $el.find('img').attr('src');
    const category = Object.keys(categoryMap).find((key) => imgSrc.includes(key)) || 'General';

    recalls.push({
      title,
      url: new URL(url, 'https://recalls-rappels.canada.ca').toString(),
      type,
      date,
      category: categoryMap[category] || 'General',
    });
  });

  return recalls;
};

module.exports = {
  parseRecallResults,
};
