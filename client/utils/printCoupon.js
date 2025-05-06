const printCoupon = (coupon) => {
  const printWindow = window.open("", "_blank", "width=600,height=600");
  if (!printWindow) return;

  printWindow.document.write(`
      <html>
        <head>
          <title>Print Coupon</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .coupon-container { border: 1px solid #000; padding: 20px; }
            .coupon-image { max-width: 100%; max-height: 300px; object-fit: contain; }
            .discount-code { font-size: 36px; font-weight: bold; margin: 20px 0; }
            .coupon-details p { margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="coupon-container">
            ${
              coupon.image_url
                ? `<img class="coupon-image" src="${coupon.image_url}" alt="Coupon Image" />`
                : ""
            }
            <div class="coupon-details">
              <h2>${coupon.product_name}</h2>
              <p>${coupon.discount_description}</p>
              <p>Store: ${coupon.store ? coupon.store : "Online"}</p>
              <p>Expires: ${coupon.expiration_date}</p>
              <div class="discount-code">Code: ${coupon.discount_code}</div>
            </div>
          </div>
        </body>
      </html>
    `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.onafterprint = () => {
    printWindow.close();
  };
};

export default printCoupon;
