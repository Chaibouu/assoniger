import { PrismaClient } from "@prisma/client";
import { decryptField, encryptField } from "@/lib/field-crypto";

/**
 * Transactions interactives : le délai par défaut de Prisma (5 s) est trop court face à la latence
 * vers la base (Neon, us-east-2) et à son réveil après une mise en veille : chaque aller-retour peut
 * prendre plusieurs secondes et la transaction expirait (erreur P2028) au milieu des écritures.
 */
function createClient() {
  const base = new PrismaClient({
    transactionOptions: {
      maxWait: 10_000, // attente max pour obtenir une connexion
      timeout: 30_000, // durée max de la transaction
    },
  });

  /** Champ bancaire chiffré à l'écriture (create / update / upsert), quel que soit l'appelant. */
  const encryptBankData = (data: unknown) => {
    if (data && typeof data === "object" && "bankAccountNumber" in data) {
      const d = data as { bankAccountNumber?: unknown };
      if (typeof d.bankAccountNumber === "string") d.bankAccountNumber = encryptField(d.bankAccountNumber);
      else if (d.bankAccountNumber && typeof d.bankAccountNumber === "object" && "set" in d.bankAccountNumber) {
        const op = d.bankAccountNumber as { set?: string | null };
        op.set = encryptField(op.set);
      }
    }
  };

  return base.$extends({
    query: {
      association: {
        async create({ args, query }) {
          encryptBankData(args.data);
          return query(args);
        },
        async update({ args, query }) {
          encryptBankData(args.data);
          return query(args);
        },
        async updateMany({ args, query }) {
          encryptBankData(args.data);
          return query(args);
        },
        async upsert({ args, query }) {
          encryptBankData(args.create);
          encryptBankData(args.update);
          return query(args);
        },
      },
    },
    result: {
      association: {
        // Déchiffré à la lecture (y compris dans les include) ; les anciennes valeurs en clair passent telles quelles
        bankAccountNumber: {
          needs: { bankAccountNumber: true },
          compute: (association) => decryptField(association.bankAccountNumber),
        },
      },
    },
  });
}

type ExtendedPrismaClient = ReturnType<typeof createClient>;

declare global {
  var prisma: ExtendedPrismaClient | undefined;
}

export const db = globalThis.prisma || createClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
