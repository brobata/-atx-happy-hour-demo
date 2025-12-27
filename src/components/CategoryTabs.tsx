import { cuisines } from '../data/venues';

interface CategoryTabsProps {
  selected: string | null;
  onChange: (cuisine: string | null) => void;
}

export function CategoryTabs({ selected, onChange }: CategoryTabsProps) {
  return (
    <div className="category-tabs">
      <button
        className={`category-tab ${selected === null ? 'active' : ''}`}
        onClick={() => onChange(null)}
      >
        All
      </button>
      {cuisines.map(cuisine => (
        <button
          key={cuisine}
          className={`category-tab ${selected === cuisine ? 'active' : ''}`}
          onClick={() => onChange(cuisine)}
        >
          {cuisine}
        </button>
      ))}
    </div>
  );
}
