import appConfig from "@/settings";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className="relative h-dvh w-full overflow-hidden bg-muted/40"
      style={{
        backgroundColor: `${appConfig.primaryColor}08`,
      }}
    >
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: `${appConfig.primaryColor}22` }}
      />
      <div
        className="pointer-events-none absolute -right-20 -bottom-24 h-80 w-80 rounded-full blur-3xl"
        style={{ backgroundColor: `${appConfig.secondaryColor}22` }}
      />
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
};

export default AuthLayout;
