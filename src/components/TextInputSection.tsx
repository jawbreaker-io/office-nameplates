const LINE_LABELS = ['First Name', 'Last Name', 'Title / Extra'] as const;
const MAX_CHARS = 20;

function transformText(index: number, text: string): string {
  // Preserve leading/trailing spaces for crude sizing
  const leadingSpaces = text.match(/^(\s*)/)?.[0] ?? '';
  const trailingSpaces = text.match(/(\s*)$/)?.[0] ?? '';
  const inner = text.slice(leadingSpaces.length, text.length - trailingSpaces.length);

  if (inner.length === 0) return text;

  let transformed: string;
  if (index === 0) {
    // First Name: capitalize first letter, lowercase rest
    transformed = inner.charAt(0).toUpperCase() + inner.slice(1).toLowerCase();
  } else {
    // Last Name and Title / Extra: ALL UPPERCASE
    transformed = inner.toUpperCase();
  }

  return leadingSpaces + transformed + trailingSpaces;
}

interface Props {
  textLines: [string, string, string];
  onTextChange: (index: 0 | 1 | 2, text: string) => void;
  isProcessing: boolean;
  disabled: boolean;
}

export function TextInputSection({ textLines, onTextChange, isProcessing, disabled }: Props) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Name Text</h3>
      <div className="space-y-2">
        {LINE_LABELS.map((label, i) => {
          const index = i as 0 | 1 | 2;
          const value = textLines[index];
          return (
            <div key={label}>
              <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
              <div className="relative">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => onTextChange(index, transformText(index, e.target.value))}
                  maxLength={MAX_CHARS}
                  disabled={isProcessing || disabled}
                  placeholder={label}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm
                    focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                    disabled:bg-gray-100 disabled:text-gray-400"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  {value.length}/{MAX_CHARS}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
