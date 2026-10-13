/**
 * Text (usually a file name) with line-break opportunities after . _ - so long names without
 * spaces wrap between their parts instead of widening the layout on small screens.
 */
export function BreakableText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(?<=[._-])/).map((part, i) => (
        <span key={i}>
          {part}
          <wbr />
        </span>
      ))}
    </>
  );
}
