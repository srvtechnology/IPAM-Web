export default function AccessDenied({ module }: { module: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <span className="material-symbols-outlined text-[48px] text-error">block</span>
      <h1 className="font-headline-lg text-on-surface">Access Restricted</h1>
      <p className="font-body-default text-on-surface-variant max-w-md">
        Your role does not have read access to the {module} module. Contact a Super Administrator if you believe
        this is incorrect.
      </p>
    </div>
  );
}
