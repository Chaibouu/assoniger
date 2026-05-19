import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { DocumentType, LegalStatus, UserRole } from "@prisma/client";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { checkPasswordPwned } from "@/lib/hibp";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { getClientIP } from "@/lib/geo";
import { rateLimitRedisEmail } from "@/lib/rateLimit";
import { associationRegistrationUploadRelative } from "@/lib/association-upload-paths";
import { uploadFile } from "@/lib/upload";
import { extractPdfTextForArreteReference, isArreteReferenceFoundInPdfText } from "@/lib/arrete-pdf-validate";

const registerSchema = z.discriminatedUnion("accountType", [
  z.object({
    accountType: z.literal("association"),
    name: z.string().min(3, "Le nom du compte est requis"),
    email: z.string().email("L'adresse email n'est pas valide"),
    password: z.string().min(8, "Le mot de passe doit comporter au moins 8 caractères"),
    associationName: z.string().min(3, "Le nom de l'association est requis"),
    presidentName: z.string().min(3, "Le nom du president est requis"),
    recognitionOrder: z.string().optional(),
    location: z.string().min(2, "La localisation est requise"),
    activityDomain: z.string().min(2, "Le domaine d'activite est requis"),
    prioritySectors: z.string().min(2, "Les secteurs prioritaires sont requis"),
    contactPhone: z.string().min(3, "Le telephone de contact est requis"),
    regionId: z.string().min(1, "La region est requise"),
    departementId: z.string().min(1, "Le departement est requis"),
    communeId: z.string().min(1, "La commune est requise"),
  }),
  z.object({
    accountType: z.literal("member"),
    name: z.string().min(3, "Le nom du compte est requis"),
    email: z.string().email("L'adresse email n'est pas valide"),
    password: z.string().min(8, "Le mot de passe doit comporter au moins 8 caractères"),
    associationId: z.string().min(1, "Veuillez selectionner une association"),
  }),
]);

export async function POST(req: NextRequest) {
  try {
    console.info("[PUBLIC_REGISTER] Début de la requête d'inscription");

    const ip = getClientIP(req);
    const rlResponse = await rateLimitRedisEmail(ip);
    if (rlResponse) {
      console.warn("[PUBLIC_REGISTER] Requête limitée (rate limit)", { ip });
      return rlResponse;
    }

    const formData = await req.formData();
    const accountTypeRaw = formData.get("accountType");
    const associationNameStr = String(formData.get("associationName") ?? "").trim();
    const nameFromForm = String(formData.get("name") ?? "").trim();
    const resolvedName =
      accountTypeRaw === "association"
        ? nameFromForm.length >= 3
          ? nameFromForm
          : associationNameStr
        : nameFromForm;

    const payload = {
      accountType: accountTypeRaw,
      name: resolvedName,
      email: formData.get("email"),
      password: formData.get("password"),
      associationId: formData.get("associationId"),
      associationName: formData.get("associationName"),
      presidentName: formData.get("presidentName"),
      recognitionOrder: formData.get("recognitionOrder"),
      location: formData.get("location"),
      activityDomain: formData.get("activityDomain"),
      prioritySectors: formData.get("prioritySectors"),
      contactPhone: formData.get("contactPhone"),
      regionId: formData.get("regionId"),
      departementId: formData.get("departementId"),
      communeId: formData.get("communeId"),
    };
    console.info("[PUBLIC_REGISTER] Payload reçu", {
      accountType: payload?.accountType,
      email: payload?.email,
      associationName: payload?.associationName,
    });

    const parsedData = registerSchema.safeParse(payload);

    if (!parsedData.success) {
      console.warn("[PUBLIC_REGISTER] Validation échouée", {
        issues: parsedData.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
      return NextResponse.json(
        { error: parsedData.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const data = parsedData.data;
    console.info("[PUBLIC_REGISTER] Validation OK", {
      accountType: data.accountType,
      email: data.email,
    });

    const existingUser = await getUserByEmail(data.email);
    if (existingUser) {
      console.warn("[PUBLIC_REGISTER] Email déjà existant", {
        email: data.email,
        emailVerified: !!existingUser.emailVerified,
      });
      if (!existingUser.emailVerified) {
        const verificationToken = await generateVerificationToken(data.email);
        await sendVerificationEmail(data.email, verificationToken);
        console.info("[PUBLIC_REGISTER] Email non vérifié, renvoi du mail de vérification", {
          email: data.email,
        });
        return NextResponse.json({
          message:
            "Un compte existe deja avec cet email mais n'est pas verifie. Un nouvel email de verification vient d'etre envoye.",
        });
      }

      return NextResponse.json({ error: "L'email est deja utilise" }, { status: 400 });
    }

    const skipHibpCheck =
      process.env.NODE_ENV !== "production" &&
      process.env.SKIP_HIBP_CHECK === "true";

    if (!skipHibpCheck) {
      const { pwned, count } = await checkPasswordPwned(data.password);
      if (pwned) {
        console.warn("[PUBLIC_REGISTER] Mot de passe compromis détecté", {
          email: data.email,
          count,
        });
        return NextResponse.json(
          {
            error: `Ce mot de passe a ete compromis dans ${count.toLocaleString("fr-FR")} fuite${count > 1 ? "s" : ""} de donnees.`,
          },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const verificationToken = await generateVerificationToken(data.email);
    console.info("[PUBLIC_REGISTER] Préparation des écritures DB terminée", {
      accountType: data.accountType,
      email: data.email,
    });

    if (data.accountType === "association") {
      console.info("[PUBLIC_REGISTER][ASSOCIATION] Début transaction de création", {
        email: data.email,
        associationName: data.associationName,
      });

      const recognitionFile = formData.get("recognitionFile");
      const logoFile = formData.get("logoFile");
      if (!(recognitionFile instanceof File)) {
        return NextResponse.json(
          { error: "Le document de l'arrêté de reconnaissance est requis" },
          { status: 400 }
        );
      }
      if (!(logoFile instanceof File)) {
        return NextResponse.json(
          { error: "Le logo de l'association est requis" },
          { status: 400 }
        );
      }

      const validLogoTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!validLogoTypes.includes(logoFile.type)) {
        return NextResponse.json(
          { error: "Le logo doit être une image (jpg, png, webp ou gif)" },
          { status: 400 }
        );
      }
      if (recognitionFile.type !== "application/pdf") {
        return NextResponse.json(
          { error: "L'arrêté de reconnaissance doit être un fichier PDF" },
          { status: 400 }
        );
      }

      const recognitionOrderTrim = (data.recognitionOrder ?? "").trim();
      if (recognitionOrderTrim.length >= 2) {
        try {
          const pdfBytes = new Uint8Array(await recognitionFile.arrayBuffer());
          const pdfText = await extractPdfTextForArreteReference(pdfBytes, recognitionOrderTrim);
          if (
            !pdfText.trim() ||
            !isArreteReferenceFoundInPdfText(recognitionOrderTrim, pdfText)
          ) {
            return NextResponse.json(
              {
                error:
                  "Le numéro de référence de l'arrêté ne correspond pas au texte détecté dans le PDF (ou le PDF ne contient pas de texte extractible). Vérifiez la référence et le document.",
              },
              { status: 400 }
            );
          }
        } catch {
          return NextResponse.json(
            { error: "Impossible d'analyser le PDF de l'arrêté. Vérifiez le fichier ou réessayez." },
            { status: 400 }
          );
        }
      }

      const communeGeo = await db.commune.findFirst({
        where: {
          id: data.communeId,
          departementId: data.departementId,
          isDeleted: false,
        },
        include: {
          departement: {
            include: { region: true },
          },
        },
      });
      if (
        !communeGeo ||
        communeGeo.departement.regionId !== data.regionId ||
        communeGeo.departement.region.isDeleted
      ) {
        return NextResponse.json(
          { error: "La selection region / departement / commune est invalide" },
          { status: 400 }
        );
      }

      let createdAssociationId = "";
      await db.$transaction(async (tx) => {
        console.info("[PUBLIC_REGISTER][ASSOCIATION] Création utilisateur association", {
          email: data.email,
          role: UserRole.ASSOCIATION,
        });
        const user = await tx.user.create({
          data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: UserRole.ASSOCIATION,
            isActive: false,
            emailVerified: null,
          },
        });
        console.info("[PUBLIC_REGISTER][ASSOCIATION] Utilisateur créé", {
          userId: user.id,
          email: user.email,
        });

        console.info("[PUBLIC_REGISTER][ASSOCIATION] Création association");
        const association = await tx.association.create({
          data: {
            name: data.associationName,
            description: `Domaine d'activite: ${data.activityDomain}. Secteurs prioritaires: ${data.prioritySectors}.`,
            contactEmail: data.email,
            contactPhone: data.contactPhone,
            address: data.location,
            receiptNumber: data.recognitionOrder,
            legalStatus: LegalStatus.OTHER,
            regionId: data.regionId,
            departementId: data.departementId,
            communeId: data.communeId,
            userId: user.id,
          },
        });
        createdAssociationId = association.id;
        console.info("[PUBLIC_REGISTER][ASSOCIATION] Association créée", {
          associationId: association.id,
          associationName: association.name,
        });

        console.info("[PUBLIC_REGISTER][ASSOCIATION] Création du président");
        await tx.associationMember.create({
          data: {
            associationId: association.id,
            fullName: data.presidentName,
            position: "President",
            isPrimary: true,
          },
        });
        console.info("[PUBLIC_REGISTER][ASSOCIATION] Président créé");
      });
      const destination = associationRegistrationUploadRelative(createdAssociationId);
      const [recognitionUpload, logoUpload] = await Promise.all([
        uploadFile(recognitionFile, {
          destination,
          allowedTypes: ["application/pdf"],
          maxSize: 10 * 1024 * 1024,
        }),
        uploadFile(logoFile, {
          destination,
          allowedTypes: validLogoTypes,
          maxSize: 10 * 1024 * 1024,
        }),
      ]);

      await db.association.update({
        where: { id: createdAssociationId },
        data: {
          receiptFileUrl: recognitionUpload.path,
          logoUrl: logoUpload.path,
        },
      });

      await db.associationDocument.create({
        data: {
          associationId: createdAssociationId,
          documentType: DocumentType.RECEIPT,
          fileName: recognitionFile.name || "arrete-reconnaissance.pdf",
          fileUrl: recognitionUpload.path,
          fileSize: recognitionFile.size || null,
          mimeType: recognitionFile.type || "application/pdf",
          isVerified: false,
        },
      });
      console.info("[PUBLIC_REGISTER][ASSOCIATION] Uploads enregistrés", {
        associationId: createdAssociationId,
        destination,
        recognitionPath: recognitionUpload.path,
        logoPath: logoUpload.path,
      });
      console.info("[PUBLIC_REGISTER][ASSOCIATION] Transaction terminée avec succès", {
        email: data.email,
      });
    } else {
      console.info("[PUBLIC_REGISTER][MEMBER] Début traitement demande membre", {
        email: data.email,
        associationId: data.associationId,
      });
      const association = await db.association.findFirst({
        where: { id: data.associationId, isDeleted: false },
        select: { id: true, name: true },
      });

      if (!association) {
        console.warn("[PUBLIC_REGISTER][MEMBER] Association introuvable", {
          associationId: data.associationId,
          email: data.email,
        });
        return NextResponse.json({ error: "Association introuvable" }, { status: 404 });
      }

      const user = await db.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: UserRole.MEMBER,
          isActive: false,
          emailVerified: null,
        },
      });
      console.info("[PUBLIC_REGISTER][MEMBER] Utilisateur membre créé", {
        userId: user.id,
        email: user.email,
      });

      await db.associationMember.create({
        data: {
          associationId: association.id,
          fullName: data.name,
          email: data.email,
          position: "MEMBER_PENDING",
          isPrimary: false,
        },
      });
      console.info("[PUBLIC_REGISTER][MEMBER] Demande membre créée dans associationMember", {
        associationId: association.id,
        email: data.email,
      });

      await db.activityLog.create({
        data: {
          associationId: association.id,
          userId: user.id,
          action: "JOIN_REQUEST",
          entity: "AssociationMembership",
          entityId: user.id,
          newValues: {
            userName: data.name,
            userEmail: data.email,
            requestedRole: "MEMBER",
            message:
              "Demande de creation de compte membre envoyee depuis le formulaire public.",
          },
        },
      });
      console.info("[PUBLIC_REGISTER][MEMBER] Activité JOIN_REQUEST créée", {
        associationId: association.id,
        userId: user.id,
      });
    }

    await sendVerificationEmail(data.email, verificationToken);
    console.info("[PUBLIC_REGISTER] Email de vérification envoyé", {
      email: data.email,
      accountType: data.accountType,
    });

    return NextResponse.json({
      message:
        data.accountType === "association"
          ? "Compte association cree. Verifiez votre email pour confirmer le compte."
          : "Demande de creation de compte membre envoyee a l'association. Verifiez votre email.",
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription publique :", error);
    console.error("[PUBLIC_REGISTER] Détails erreur", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
