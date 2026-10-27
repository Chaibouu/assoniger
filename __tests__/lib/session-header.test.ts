/**
 * @jest-environment node
 */
import { decodeSessionHeader, encodeSessionHeader } from "@/lib/session-header";

describe("en-tête de session signé (middleware → pages)", () => {
  const OLD_ENV = process.env.AES_SECRET_KEY;

  beforeEach(() => {
    process.env.AES_SECRET_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  });

  afterAll(() => {
    process.env.AES_SECRET_KEY = OLD_ENV;
    jest.useRealTimers();
  });

  const session = { user: { user: { id: "u1", role: "ADMIN" } } };

  it("restitue la session encodée par le middleware", () => {
    const header = encodeSessionHeader(session);
    expect(decodeSessionHeader(header)).toEqual(session);
  });

  it("refuse une valeur forgée sans la clé (élévation de rôle)", () => {
    const body = Buffer.from(JSON.stringify({ v: session, t: Date.now() })).toString("base64url");
    expect(decodeSessionHeader(`${body}.signature-inventee`)).toBeNull();
  });

  it("refuse une valeur dont le contenu a été modifié après signature", () => {
    const header = encodeSessionHeader(session)!;
    const [, signature] = header.split(".");
    const tampered = Buffer.from(
      JSON.stringify({ v: { user: { user: { id: "u2", role: "SUPER_ADMIN" } } }, t: Date.now() })
    ).toString("base64url");
    expect(decodeSessionHeader(`${tampered}.${signature}`)).toBeNull();
  });

  it("refuse une valeur expirée (rejeu)", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-01T10:00:00Z"));
    const header = encodeSessionHeader(session);
    jest.setSystemTime(new Date("2026-01-01T10:02:00Z"));
    expect(decodeSessionHeader(header)).toBeNull();
    jest.useRealTimers();
  });

  it("ignore un en-tête absent ou mal formé", () => {
    expect(decodeSessionHeader(null)).toBeNull();
    expect(decodeSessionHeader("pas-un-entete")).toBeNull();
  });
});
