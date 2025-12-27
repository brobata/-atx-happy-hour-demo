interface DealTypeFilterProps {
  dealType: 'all' | 'drinks' | 'food';
  onChange: (type: 'all' | 'drinks' | 'food') => void;
}

export function DealTypeFilter({ dealType, onChange }: DealTypeFilterProps) {
  return (
    <div className="deal-type-filter">
      <label className="filter-label">Deal Type</label>
      <div className="deal-type-chips">
        <button
          className={`chip deal-chip ${dealType === 'all' ? 'active' : ''}`}
          onClick={() => onChange('all')}
        >
          🍻 All Deals
        </button>
        <button
          className={`chip deal-chip ${dealType === 'drinks' ? 'active' : ''}`}
          onClick={() => onChange('drinks')}
        >
          🍸 Drink Specials
        </button>
        <button
          className={`chip deal-chip ${dealType === 'food' ? 'active' : ''}`}
          onClick={() => onChange('food')}
        >
          🍔 Food Specials
        </button>
      </div>
    </div>
  );
}
