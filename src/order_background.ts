import { z } from "zod";
import { backgroundRemove, InfraiError } from "./infrai_client.js";

export const orderSchema = z.object({ orderId: z.string().min(1), sourceImage: z.string().min(1), outputFormat: z.enum(["png", "webp"]) });
export type ListingOrder = z.infer<typeof orderSchema>;

export async function prepareListing(input: unknown): Promise<{ orderId: string; imageId: string; status: "ready" }> {
  const order = orderSchema.parse(input);
  const result = await backgroundRemove(order.sourceImage, order.outputFormat, order.orderId);
  return { orderId: order.orderId, imageId: result.id, status: "ready" };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const raw = process.env.ORDER_JSON ?? JSON.stringify({ orderId: "demo-100", sourceImage: "https://example.com/product.jpg", outputFormat: "png" });
  prepareListing(JSON.parse(raw)).then((receipt) => console.log(JSON.stringify(receipt))).catch((error: unknown) => {
    if (error instanceof InfraiError) { console.error(JSON.stringify({ status: error.status, code: error.code, message: error.message })); process.exitCode = 1; return; }
    console.error(error); process.exitCode = 1;
  });
}
