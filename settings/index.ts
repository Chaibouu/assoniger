const appConfig = {
  appName: "Sahel Coders Starter",
  websiteTitle: "Website Starter",
  websiteDescription:
    "Sahel Coders simple authentication service and admin panel",
  logoUrl: "/logo.jpg",
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
  publicRoutes: ["/", "/test"],
  defaultLoginRedirect: "/dashboard/settings",
};
export default appConfig;
