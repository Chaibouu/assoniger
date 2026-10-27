/**
 * @jest-environment node
 */
import { decryptField, encryptField, isEncryptedField } from "@/lib/field-crypto";

describe("chiffrement des champs sensibles (numéro de compte bancaire)", () => {
  beforeAll(() => {
    process.env.AES_SECRET_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  });

  it("chiffre puis restitue la valeur d'origine", () => {
    const encrypted = encryptField("NE123 01001 000123456789 47");
    expect(encrypted).not.toContain("000123456789");
    expect(isEncryptedField(encrypted)).toBe(true);
    expect(decryptField(encrypted)).toBe("NE123 01001 000123456789 47");
  });

  it("produit un chiffré différent à chaque fois (IV aléatoire)", () => {
    expect(encryptField("123")).not.toBe(encryptField("123"));
  });

  it("laisse passer les anciennes valeurs en clair (migration progressive)", () => {
    expect(decryptField("123456789")).toBe("123456789");
  });

  it("ne rechiffre pas une valeur déjà chiffrée", () => {
    const once = encryptField("abc");
    expect(encryptField(once)).toBe(once);
  });

  it("laisse null, undefined et vide inchangés", () => {
    expect(encryptField(null)).toBeNull();
    expect(encryptField(undefined)).toBeUndefined();
    expect(encryptField("")).toBe("");
  });

  it("ne renvoie jamais le texte chiffré si la donnée a été altérée", () => {
    const encrypted = encryptField("secret");
    const tampered = encrypted.slice(0, -4) + "AAAA";
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(decryptField(tampered)).toBeNull();
    spy.mockRestore();
  });
});
