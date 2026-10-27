import { NextRequest } from "next/server";

// Interface pour les informations de géolocalisation
export interface GeoInfo {
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

// Fonction pour extraire l'IP de manière compatible avec tous les hébergeurs
/**
 * IP du client, utilisée pour le rate limiting et l'audit.
 *
 * Les headers d'IP sont fournis par le client et donc falsifiables : on ne lit que
 * ce que le proxy de confiance a écrit.
 * - `TRUSTED_IP_HEADER` : header posé par le proxy et écrasant la valeur client
 *   (ex. `cf-connecting-ip` derrière Cloudflare, `x-real-ip` avec nginx).
 * - Sinon `x-forwarded-for` : on prend l'entrée ajoutée par le proxy le plus proche,
 *   en partant de la droite (`TRUSTED_PROXY_COUNT`, 1 par défaut). Le premier élément,
 *   écrit par le client, n'est jamais utilisé.
 */
export function getClientIP(req: { headers: Pick<Headers, "get"> }): string {
  const trustedHeader = process.env.TRUSTED_IP_HEADER?.trim().toLowerCase();
  if (trustedHeader && trustedHeader !== "x-forwarded-for") {
    const value = req.headers.get(trustedHeader)?.trim();
    return value || "127.0.0.1";
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const hops = forwardedFor
      .split(",")
      .map((ip) => ip.trim())
      .filter((ip) => ip && ip !== "unknown");
    const proxyCount = Math.max(1, parseInt(process.env.TRUSTED_PROXY_COUNT ?? "1", 10) || 1);
    const ip = hops[Math.max(0, hops.length - proxyCount)];
    if (ip) return ip;
  }

  return "127.0.0.1";
}

// Fonction pour obtenir les informations de géolocalisation
// Compatible avec tous les hébergeurs (VPS, Vercel, etc.)
export async function getGeoInfo(req: NextRequest): Promise<GeoInfo> {
  try {
    const ip = getClientIP(req);
    
    // Éviter les appels API pour les IPs locales
    if (ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
      return {
        country: "Local",
        city: "Development",
      };
    }

    // Utiliser une API gratuite pour la géolocalisation (HTTPS obligatoire)
    const response = await fetch(`https://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,lat,lon,timezone`);
    const data = await response.json();

    if (data.status === "success") {
      return {
        country: data.country,
        region: data.regionName,
        city: data.city,
        latitude: data.lat,
        longitude: data.lon,
        timezone: data.timezone,
      };
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de la géolocalisation:", error);
  }

  return {};
}

// Fonction pour vérifier si l'IP est dans une liste de pays autorisés
export function isCountryAllowed(geoInfo: GeoInfo, allowedCountries: string[]): boolean {
  if (!allowedCountries.length) return true;
  if (!geoInfo.country) return true; // Si on ne peut pas déterminer le pays, autoriser
  
  return allowedCountries.includes(geoInfo.country);
}

// Fonction pour obtenir le fuseau horaire de l'utilisateur
export function getUserTimezone(geoInfo: GeoInfo): string {
  return geoInfo.timezone || "UTC";
} 