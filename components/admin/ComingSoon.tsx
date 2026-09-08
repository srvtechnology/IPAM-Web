export default function ComingSoon({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low py-24 text-center">
      <span className="material-symbols-outlined text-primary text-[40px]">{icon}</span>
      <h1 className="font-headline-md text-on-surface mt-4">{title}</h1>
      <p className="font-body-default text-on-surface-variant mt-1 max-w-sm">
        This module is scheduled for the next build milestone — schema and permissions are already in
        place, the screen just hasn&apos;t been wired up yet.
      </p>
    </div>
  );
}
