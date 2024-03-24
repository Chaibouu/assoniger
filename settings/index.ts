const appConfig = {
    appName :"Website starter",
    websiteTitle : "first starter",
    websiteDescription : "hello this is the starter",
    logoUrl : "/logo.jpg",
    adminSidebarColor : "#1C2434",
    mailOptions : {
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        secure: true,
        auth: {
          user: process.env.MAIL_AUTH_USER,
          pass: process.env.MAIL_AUTH_PASSWORD,
        },
    },
    publicRoutes:[
        "/",
        "/admins"
    ],
    defaultLoginRedirect:"/settings"
}
export default appConfig