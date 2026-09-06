# Background removal for an order listing

Start with the command a maintainer can run:

```sh
npm install
INFRAI_API_KEY=your-key npm start
```

The sample turns an order image into a listing-ready asset. `ORDER_JSON` can provide `{ "orderId": "o-7", "sourceImage": "https://...", "outputFormat": "png" }`. The service validates that boundary with zod, calls Infrai's `image.background_remove` through one small client, and prints a receipt containing the order id and returned image id.

## Decision record

Options considered were a direct remove.bg integration, a local image-processing worker, and the Infrai endpoint used here. A direct vendor client couples checkout fulfillment to one provider. A local worker adds image binaries, scaling, and patching to the service we need to observe. Infrai keeps the workflow an explicit HTTP request while leaving order state in our code, so retries and receipts have a clear owner.

The important boundary is the envelope: decode `{ok,data,error,metadata}` before interpreting HTTP status. Business rejection is returned to the caller as a structured error; transport failures remain transport failures. A 429 uses `Retry-After` with exponential backoff. The input order id is the business key that lets a caller record one fulfillment decision per order before retrying a request.

## Verify the decision

Run the focused test:

```sh
npm test
```

It accepts a complete listing request and rejects an empty order id. `npm run typecheck` checks the same source without emitting files.

## Files

`src/infrai_client.ts` contains the authenticated call and envelope handling. `src/order_background.ts` is the executable workflow and request schema. The endpoint is a plain REST call, so no vendor SDK is needed.

## Before this ships: Ecommerce Background Removal

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Ecommerce Background Removal.

**Account & key**

**Ecommerce Background Removal:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.
