import { hash as bcryptHash, compare as bcryptCompare } from "bcrypt-ts-edge";

const encoder = new TextEncoder();

async function legacyHash(plainPassword: string): Promise<string> {
  const key = encoder.encode(process.env.ENCRYPTION_KEY!);
  const passwordData = encoder.encode(plainPassword);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"]
  );

  const hashBuffer = await crypto.subtle.sign("HMAC", cryptoKey, passwordData);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const hash = async (plainPassword: string): Promise<string> => {
  return bcryptHash(plainPassword, 10);
};

export const compare = async (
  plainPassword: string,
  storedPassword: string
): Promise<boolean> => {
  if (storedPassword.startsWith("$2")) {
    return bcryptCompare(plainPassword, storedPassword);
  }
  const hashedPassword = await legacyHash(plainPassword);
  return hashedPassword === storedPassword;
};
