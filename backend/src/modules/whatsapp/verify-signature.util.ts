import { createHmac, timingSafeEqual } from "crypto";

export function verifyMetaSignature(appSecret: string, rawBody: Buffer, headerSig: string | undefined): boolean {
  if (!headerSig?.startsWith("sha256=") || !appSecret) {
    return false;
  }
  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  if (headerSig.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(headerSig, "utf8"), Buffer.from(expected, "utf8"));
}
