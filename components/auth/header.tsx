interface HeaderProps {
  label: string;
};

export const Header = ({ label }: HeaderProps) => {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-y-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Logo AssoNiger"
        className="h-auto w-20"
      />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
};