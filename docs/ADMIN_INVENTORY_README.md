# Admin Inventory And AI Import Guide

This guide is for a non-technical store operator managing products, stock, orders, and custom requests from the admin area.

## Getting Into Admin

1. Go to:

```text
https://your-domain.com/admin
```

2. Log in with the admin email and password.

If login fails repeatedly, wait a few minutes before trying again. The admin login is rate limited for security.

## Admin Sections

The admin sidebar has four main areas:

- Dashboard: store totals and recent notification status.
- Products: product catalog, stock, visibility, images, and AI import.
- Orders: paid product orders and fulfillment status.
- Custom: customer custom commission requests and quotes.

## Product Status Basics

Products have two important availability controls:

- Stock: how many units are available to sell.
- Active: whether the product is visible in the public store.

A product with stock `0` cannot be purchased. An inactive product is hidden from shoppers even if it has stock.

## Adding A Product Manually

1. Open Admin.
2. Go to Products.
3. Click `+ New Product`.
4. Fill in the product fields.
5. Upload one or more product images.
6. Confirm `Active` is checked if the item should appear in the store.
7. Click `Create Product`.

### Product Fields

- Name: customer-facing product name.
- Slug: the web address ending for the product. Example: `rhinestone-lighter`.
- Description: the customer-facing product description.
- Category: where the product appears in the catalog.
- Price: price in US dollars.
- Stock: quantity available to sell.
- Featured product: shows the product in featured areas.
- Active: makes the product visible in the store.
- Images: product images shown to customers.

Use lowercase letters, numbers, and hyphens in the slug. Do not use spaces.

## Uploading Product Images

On the product form:

1. Find the Images section.
2. Click the `+` image box.
3. Choose image files from your device.
4. Wait for each image to finish uploading.
5. Save the product.

Images are uploaded to Vercel Blob storage. Very large images may be compressed automatically before upload.

To remove an image, hover over the image preview and click the remove button.

## Editing A Product

1. Open Admin.
2. Go to Products.
3. Find the product.
4. Click Edit.
5. Change the fields.
6. Click `Update Product`.

Editing stock changes what customers can buy immediately.

## Making A Product Visible Or Hidden

From the Products list:

1. Find the product.
2. Click the status button.
3. `Active` means shoppers can see it.
4. `Inactive` means it is hidden.

Use inactive for drafts, paused products, or items you do not want public yet.

## Managing Inventory

Stock should be the number physically available to sell.

Example:

- You have 3 finished lighters ready to ship.
- Set stock to `3`.
- A customer buys 1.
- The site reserves and then finalizes that sale through Stripe.
- Stock becomes `2`.

If you make another unit, edit the product and increase stock.

If you sell an item outside the website, reduce stock manually so the online store stays accurate.

## Important Inventory Notes

- Checkout reserves stock while the customer is paying.
- If the customer does not finish checkout, stock is returned after Stripe reports the checkout expired.
- If payment succeeds, the order appears in Admin Orders.
- Do not add stock for an item unless it is actually available to sell.
- Refunds in Stripe do not automatically add stock back. If the item can be resold, update stock manually.

## Using AI Product Import

The AI Product Generator is available only when creating a new product.

It can:

- Look at messy product reference photos.
- Draft the product name, description, category, price, stock, featured setting, and active setting.
- Create a clean square catalog image.
- Upload the generated catalog image to product images.

### Before Using AI Import

The site must have:

- OpenAI configured.
- Vercel Blob image storage configured.
- You must be logged into admin.

If either service is missing, the AI generator will show an error.

### Best Photos To Upload

Use clear photos where the item is easy to see.

Good reference photos:

- Show the whole product.
- Are well lit.
- Show decoration details.
- Avoid too many extra objects in the background.
- Show only one item or one matching set when possible.

You can upload up to four photos.

### Generate A Draft

Use this when you want to review before publishing.

1. Open Admin.
2. Go to Products.
3. Click `+ New Product`.
4. In AI Product Generator, click Photos.
5. Choose up to four product photos.
6. Click `Generate Draft`.
7. Review every field.
8. Correct the name, description, price, stock, category, active setting, and image if needed.
9. Click `Create Product`.

This is the recommended workflow because you approve the product before it goes live.

### Generate And Create

Use this only when you are comfortable reviewing the product after it is created.

1. Upload photos in AI Product Generator.
2. Click `Generate + Create`.
3. The site creates the product if the AI result passes validation.
4. Open the new product from the Products list.
5. Review and edit it.

If you do not want the item public yet, edit the product and uncheck `Active`.

## What To Review After AI Import

Always check:

- Product name is accurate.
- Description does not promise materials or details that are not true.
- Category is correct.
- Price is correct.
- Stock is correct.
- Active is correct.
- Generated image looks like the actual item.
- No extra objects, text, hands, watermarks, or incorrect decorations appear in the image.

AI output is a draft. The store operator is responsible for the final product listing.

## Order Fulfillment

1. Open Admin.
2. Go to Orders.
3. Click View on an order.
4. Review customer, shipping address, products, quantities, and total.
5. Update the status as the order moves through fulfillment.

Order statuses:

- New: paid order received.
- Prep: gathering item and materials.
- Assembly: item is being made or finished.
- Shipping: packed or ready to ship.
- Shipped: sent to the customer.
- Cancelled: order will not be fulfilled.

Shipping labels and carrier tracking are handled outside this admin unless a future feature adds them.

## Custom Requests

Customers can submit custom commission requests from the public site.

To manage them:

1. Open Admin.
2. Go to Custom.
3. Open the request.
4. Read the customer's description.
5. Review any reference images.
6. Decide the quote amount.
7. Create a Stripe payment link for that quote.
8. Enter the quote amount.
9. Paste the Stripe payment link.
10. Set the status to `Quoted`.
11. Save the request.

If email notifications are configured, the customer receives an email with the quote and payment link.

Custom request statuses:

- Pending: waiting for review.
- Quoted: quote sent or ready.
- Paid: customer paid the quote.
- Prep: preparing materials.
- Assembly: work is in progress.
- Shipping: ready to ship.
- Shipped: completed and sent.
- Cancelled: request will not be completed.

## Daily Operating Checklist

1. Check Orders for new paid orders.
2. Move orders through the correct fulfillment status.
3. Check Custom for new custom requests.
4. Review failed or pending notifications on the dashboard.
5. Update product stock after making new items or selling items outside the website.
6. Hide inactive or unavailable items.
7. Review AI-created products before leaving them active.

## Troubleshooting

### Product Is Not Visible In The Store

Check:

- Product is Active.
- Stock is greater than `0`.
- Product has a valid category.
- Product was saved successfully.

### Product Cannot Be Purchased

Check:

- Stock is greater than `0`.
- Product is Active.
- Stripe is configured.
- The product price is greater than `0`.

### Image Upload Fails

Try:

- Use JPG, PNG, WebP, or AVIF.
- Use a smaller image.
- Check that image storage is configured.
- Refresh admin and try again.

### AI Import Fails

Check:

- At least one photo was selected.
- Photos are JPG, PNG, WebP, or AVIF.
- OpenAI is configured.
- Image storage is configured.
- Try fewer photos or clearer photos.

### Customer Paid But Order Is Missing

Check Stripe webhook setup. The store creates product orders from Stripe webhook events, not from the success page alone.
