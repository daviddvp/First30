/** Logotipo + nombre del producto. */
export function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[15px] font-extrabold text-white">F</span>
      <div className="leading-none">
        <div className="text-[15px] font-extrabold">First30</div>
        <div className="mt-0.5 text-[11px] text-faint">Onboarding de socios</div>
      </div>
    </div>
  );
}
