import { SHEET_TABS } from "@/pages/character-sheet/types";

export function SheetTabBar({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  function onKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const dir = event.key === "ArrowRight" ? 1 : -1;
    const next = (index + dir + SHEET_TABS.length) % SHEET_TABS.length;
    const id = SHEET_TABS[next]!.id;
    onSelect(id);
    requestAnimationFrame(() => {
      document.getElementById(`sheet-tab-${id}`)?.focus();
    });
  }

  return (
    <nav className="sheet-tab-bar" role="tablist" aria-label="Secciones de la ficha">
      {SHEET_TABS.map(({ id, label }, index) => (
        <button
          type="button"
          key={id}
          role="tab"
          id={`sheet-tab-${id}`}
          aria-controls={`sheet-panel-${id}`}
          aria-selected={active === id}
          tabIndex={active === id ? 0 : -1}
          className={active === id ? "sheet-tab sheet-tab-active" : "sheet-tab"}
          onClick={() => onSelect(id)}
          onKeyDown={(e) => onKeyDown(e, index)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
