import { BatteryFull, Signal, Wifi } from 'lucide-react';

export function MobileStatusBar() {
  return (
    <div className="flex h-11 items-center justify-between px-6" aria-hidden="true">
      <span className="font-display text-sm font-semibold">9:41</span>
      <div className="flex items-center gap-2 text-foreground">
        <Signal size={16} />
        <Wifi size={16} />
        <BatteryFull size={22} />
      </div>
    </div>
  );
}

export function MobilePageHeader({
  eyebrow,
  title,
  className = '',
}: {
  eyebrow: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 pt-4 ${className}`}>
      <p className="font-display text-[11px] font-semibold uppercase leading-[14px] tracking-[.015em] text-muted-foreground">{eyebrow}</p>
      <h1 className="font-display text-[44px] font-semibold uppercase leading-[1.3] tracking-[.0125em]">{title}</h1>
    </div>
  );
}