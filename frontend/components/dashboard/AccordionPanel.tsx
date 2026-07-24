'use client';

/**
 * Colapsable animado con CSS puro (técnica grid-template-rows 0fr↔1fr) —
 * sin medir alturas en JS, sin librerías. `open` controla la expansión;
 * el contenido permanece montado (solo colapsado a 0 y con opacity 0) para
 * que la transición de cierre también sea suave.
 */
export function AccordionPanel({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out ${
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
      aria-hidden={!open}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`transition-opacity duration-200 ease-out ${
            open ? 'opacity-100 delay-100' : 'opacity-0'
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
