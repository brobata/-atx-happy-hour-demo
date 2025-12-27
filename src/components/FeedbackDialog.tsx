import { useState } from 'react';

type FeedbackType = 'bug' | 'feature' | 'venue' | 'correction' | 'other';

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const feedbackTypes: { value: FeedbackType; label: string; icon: string; description: string }[] = [
  {
    value: 'venue',
    label: 'Add a Venue',
    icon: '📍',
    description: 'Suggest a bar or restaurant we should add',
  },
  {
    value: 'correction',
    label: 'Correction',
    icon: '✏️',
    description: 'Fix incorrect info (hours, prices, etc)',
  },
  {
    value: 'feature',
    label: 'Feature Request',
    icon: '✨',
    description: 'Request a new feature or improvement',
  },
  {
    value: 'bug',
    label: 'Bug Report',
    icon: '🐛',
    description: 'Something is broken or not working',
  },
  {
    value: 'other',
    label: 'Other',
    icon: '💬',
    description: 'General feedback or comments',
  },
];

export function FeedbackDialog({ isOpen, onClose }: FeedbackDialogProps) {
  const [type, setType] = useState<FeedbackType>('venue');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);

    // Store feedback locally for now (will be sent to database later)
    const feedback = {
      id: crypto.randomUUID(),
      type,
      title: title.trim(),
      description: description.trim(),
      email: email.trim() || null,
      createdAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      pageUrl: window.location.href,
    };

    // Store in localStorage for now
    const existingFeedback = JSON.parse(localStorage.getItem('atx_feedback') || '[]');
    existingFeedback.push(feedback);
    localStorage.setItem('atx_feedback', JSON.stringify(existingFeedback));

    // Simulate network delay
    await new Promise(r => setTimeout(r, 500));

    setIsSubmitting(false);
    setSubmitted(true);

    // Reset after showing success
    setTimeout(() => {
      setTitle('');
      setDescription('');
      setEmail('');
      setType('venue');
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  const selectedType = feedbackTypes.find(t => t.value === type);

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        {submitted ? (
          <div className="dialog-success">
            <div className="success-icon">✓</div>
            <h2>Thank You!</h2>
            <p>Your feedback has been submitted.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="dialog-header">
              <h2>Submit Feedback</h2>
              <p>Help us improve ATX Happy Hour</p>
              <button type="button" className="dialog-close" onClick={onClose}>✕</button>
            </div>

            <div className="dialog-content">
              {/* Feedback Type */}
              <div className="form-group">
                <label>Type</label>
                <div className="type-grid">
                  {feedbackTypes.map(ft => (
                    <button
                      key={ft.value}
                      type="button"
                      className={`type-button ${type === ft.value ? 'active' : ''}`}
                      onClick={() => setType(ft.value)}
                    >
                      <span className="type-icon">{ft.icon}</span>
                      <span className="type-label">{ft.label}</span>
                    </button>
                  ))}
                </div>
                {selectedType && (
                  <p className="type-description">{selectedType.description}</p>
                )}
              </div>

              {/* Title */}
              <div className="form-group">
                <label htmlFor="title">
                  {type === 'venue' ? 'Venue Name' : 'Title'}
                </label>
                <input
                  id="title"
                  type="text"
                  placeholder={
                    type === 'venue'
                      ? 'e.g., The Driskill Bar'
                      : type === 'correction'
                      ? 'e.g., Wrong hours for Whislers'
                      : 'Brief summary'
                  }
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  maxLength={255}
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label htmlFor="description">Details</label>
                <textarea
                  id="description"
                  placeholder={
                    type === 'venue'
                      ? 'Address, happy hour times, deals, why you love it...'
                      : type === 'correction'
                      ? 'What needs to be fixed? Provide the correct information...'
                      : 'Please provide as much detail as possible...'
                  }
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  rows={4}
                />
              </div>

              {/* Email (optional) */}
              <div className="form-group">
                <label htmlFor="email">Email (optional)</label>
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                <p className="form-hint">We'll only contact you if we need more info</p>
              </div>
            </div>

            <div className="dialog-footer">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={isSubmitting || !title.trim() || !description.trim()}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function FeedbackButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="feedback-button" onClick={onClick}>
      <span className="feedback-icon">💬</span>
      <span>Feedback</span>
    </button>
  );
}
