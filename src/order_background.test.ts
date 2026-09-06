import assert from "node:assert/strict";
import { orderSchema } from "./order_background.js";

const parsed = orderSchema.parse({ orderId: "o-7", sourceImage: "https://cdn.test/item.jpg", outputFormat: "png" });
assert.equal(parsed.outputFormat, "png");
assert.throws(() => orderSchema.parse({ orderId: "", sourceImage: "x", outputFormat: "png" }));
console.log("order boundary: valid listing accepted, empty order rejected");
