import { useRef, useEffect } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
  searchTimeMs: number;
}

export function SearchInput({ value, onChange, resultCount, searchTimeMs }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="search-input-container">
      <div className="search-icon">🔍</div>
      <input
        ref={inputRef}
        type="text"
        className="search-input"
        placeholder="Search venues, deals, neighborhoods..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
      {value && (
        <button
          className="clear-button"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
      <div className="search-meta">
        {resultCount} results in {searchTimeMs.toFixed(1)}ms
      </div>
    </div>
  );
}
