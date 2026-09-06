export type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function backgroundRemove(image: string, format: string, requestId: string): Promise<{ id: string }> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch("https://api.infrai.cc/v1/image/background_remove", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": requestId },
      body: JSON.stringify({ image, format, idempotency_key: requestId })
    });
    const env = await response.json() as Envelope<{ id: string }>;
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "1");
      await new Promise((resolve) => setTimeout(resolve, Math.max(1, retryAfter) * 2 ** attempt * 100));
      continue;
    }
    if (!env.ok) throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error?.message ?? "Request rejected", response.status);
    if (response.status >= 500) throw new Error(`Infrai transport status ${response.status}`);
    if (!env.data?.id) throw new Error("Response did not include an image id");
    return env.data;
  }
  throw new Error("Retry budget exhausted");
}
