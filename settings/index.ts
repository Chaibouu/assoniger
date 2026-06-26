const appConfig = {
  appName: "AssoNiger",
  websiteTitle: "Plateforme des Associations du Niger",
  websiteDescription:
    "L'annuaire officiel des associations nigériennes – Trouvez, rejoignez ou soutenez une association près de chez vous",
  logoUrl: "/logo.png",
  sidebarClearlogoUrl: "/sahel_coders_logo.png",
  adminSidebarColor: "#1C2434",
  mailOptions: {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: true,
    auth: {
      user: process.env.MAIL_AUTH_USER,
      pass: process.env.MAIL_AUTH_PASSWORD,
    },
  },

  // Coordonnées (ajout)
  contactEmail: "contact@assosniger.org",
  contactPhone: "+227 80 00 00 00",
  contactAddress: "Niamey, Niger - Quartier Plateau",

  publicRoutes: ["/", "/associations"],
  defaultLoginRedirect: "/test",
  primaryColor: "#035740", 
  pprimaryColor: "#146934", 
  secondaryColor: "#E26E12", 
  primaryDarkColor: "#024a36",
  secondaryDarkColor: "#d45a08",
  primaryLightColor: "#57b58f",
  secondaryLightColor: "#f7bc7a",
  primaryTransparentColor: "#03574020",
  secondaryTransparentColor: "#E26E1220",
  primaryLightTransparentColor: "#03574010",
  secondaryLightTransparentColor: "#E26E1210",

  // Ajout d'une option pour autoriser ou non les connexions multiples
  allowMultipleSessions: false, // ou false pour invalider les anciennes sessions

  // Rate limiting global — par IP
  rateLimit: {
    windowMs: 60 * 1000, // Fenêtre de 60 secondes (au lieu de 10s trop facilement contournable)
    max: 20, // 20 requêtes max par IP par fenêtre (routes publiques)
  },

  // Rate limiting strict pour les endpoints d'authentification sensibles
  rateLimitAuth: {
    windowMs: 15 * 60 * 1000, // Fenêtre de 15 minutes
    max: 10, // 10 tentatives max par IP (login, signup, reset)
  },

  // Rate limiting pour l'envoi d'emails (forgot-password, resend verification)
  rateLimitEmail: {
    windowMs: 60 * 60 * 1000, // Fenêtre de 1 heure
    max: 5, // 5 emails max par IP par heure (anti email-bombing)
  },

  // Configuration du Backoff progressif
  backoff: {
    maxAttempts: 5, // Nombre maximal de tentatives de connexion avant blocage
    backoffDelayFactor: 2, // Facteur de progression du backoff (multiplicateur)
  },
};

export default appConfig;
