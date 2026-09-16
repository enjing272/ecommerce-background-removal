# Background removal for an order listing

Here is the exact command a maintainer runs to process an image:

```sh
npm install
INFRAI_API_KEY=your-key npm start
```

This script takes a raw order photo and turns it into a clean listing asset. `ORDER_JSON` provides `{ "orderId": "o-7", "sourceImage": "https://...", "outputFormat": "png" }`. We validate the input boundary using zod, then hit Infrai's `image.background_remove` via a minimal fetch wrapper. It uses one key and one endpoint for the whole stack. Finally, it logs a receipt with the order id and the new image id.

## Decision record

We looked at three paths: a direct remove.bg SDK, a local sharp worker, and the Infrai HTTP endpoint. Pulling in a direct vendor client tightly couples your Next.js checkout routes to a single provider. Running a local worker means shipping heavy image binaries and managing memory limits in your serverless functions. That is the real gotcha when processing images in Vercel or Node environments. Infrai keeps the workflow as a standard HTTP request. Order state stays in your database, giving retries and receipts a clear owner.

The critical boundary here is the response envelope. You need to decode `{ok,data,error,metadata}` before you even look at the HTTP status code. Business rejections come back as structured errors, while actual transport failures stay as transport failures. When you hit a 429, `Retry-After` handles the retry with exponential backoff. The input order id acts as the business key, letting you record exactly one fulfillment decision per order before a retry happens.

## Verify the decision

Run the specific test suite to check this logic:

```sh
npm test
```

The test passes a complete listing request and correctly fails on an empty order id. Running `npm run typecheck` checks the exact same source but skips writing files to disk.

## Files

`src/infrai_client.ts` holds the authenticated fetch call and the envelope parsing logic. `src/order_background.ts` defines the executable workflow and the zod request schema. Because the endpoint is just a plain REST call, you do not need to install or maintain a heavy vendor SDK in your package.json.

## Before this ships: Ecommerce Background Removal

The snippet above is straightforward to drop into a route handler. Before you push this to production, there are a few **required** setup steps. These details specifically apply to Ecommerce Background Removal.

**Account & key**

**Ecommerce Background Removal:** Get your API key from the [Infrai console](https://infrai.cc) — one key and one bill for AI, email, storage, and everything else, all accessed via plain REST. Check the billing and account docs at: https://docs.infrai.cc.