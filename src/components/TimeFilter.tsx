interface TimeFilterProps {
  timeFilter: 'all' | 'now' | 'soon' | 'today';
  selectedDay: string | null;
  onTimeFilterChange: (filter: 'all' | 'now' | 'soon' | 'today') => void;
  onDayChange: (day: string | null) => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function TimeFilter({ timeFilter, selectedDay, onTimeFilterChange, onDayChange }: TimeFilterProps) {
  const today = DAYS[new Date().getDay()];

  return (
    <div className="time-filter">
      <div className="time-filter-section">
        <label className="filter-label">When</label>
        <div className="time-chips">
          <button
            className={`chip time-chip ${timeFilter === 'all' ? 'active' : ''}`}
            onClick={() => onTimeFilterChange('all')}
          >
            Any Time
          </button>
          <button
            className={`chip time-chip happening-now ${timeFilter === 'now' ? 'active' : ''}`}
            onClick={() => onTimeFilterChange('now')}
          >
            <span className="pulse-dot"></span>
            Happening Now
          </button>
          <button
            className={`chip time-chip ${timeFilter === 'soon' ? 'active' : ''}`}
            onClick={() => onTimeFilterChange('soon')}
          >
            Starting Soon
          </button>
          <button
            className={`chip time-chip ${timeFilter === 'today' ? 'active' : ''}`}
            onClick={() => onTimeFilterChange('today')}
          >
            Today ({today.slice(0, 3)})
          </button>
        </div>
      </div>

      <div className="time-filter-section">
        <label className="filter-label">Check a Specific Day</label>
        <div className="day-chips">
          {DAYS.map(day => (
            <button
              key={day}
              className={`chip day-chip ${selectedDay === day ? 'active' : ''} ${day === today ? 'today' : ''}`}
              onClick={() => onDayChange(selectedDay === day ? null : day)}
            >
              {day.slice(0, 3)}
              {day === today && <span className="today-dot"></span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
