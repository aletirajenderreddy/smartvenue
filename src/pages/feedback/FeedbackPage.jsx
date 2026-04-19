import { useState } from 'react';
import PageTransition from '../../components/common/PageTransition';
import { submitFeedback } from '../../services/feedback.service';

function Rating({ label, value, onChange }) {
  return (
    <fieldset className='rounded-lg bg-white/[0.06] p-3'>
      <legend className='mb-2 text-sm font-bold'>{label}</legend>
      <div className='grid grid-cols-5 gap-2'>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type='button'
            aria-label={`${label} ${star} stars`}
            className={`rounded-md p-2 font-bold ${star <= value ? 'bg-warning text-black' : 'bg-white/10'}`}
            onClick={() => onChange(star)}
          >
            {star}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function FeedbackPage() {
  const [rating, setRating] = useState(5);
  const [crowdRating, setCrowdRating] = useState(5);
  const [foodRating, setFoodRating] = useState(5);
  const [safetyRating, setSafetyRating] = useState(5);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');

  const submit = async () => {
    try {
      const result = await submitFeedback({
        eventId: 'demoEvent',
        rating,
        crowdRating,
        foodRating,
        safetyRating,
        comment
      });
      setMessage(`Feedback saved. Sentiment: ${result.sentiment}.`);
    } catch (err) {
      setMessage(err.message || 'Unable to submit feedback');
    }
  };

  return (
    <PageTransition className='space-y-4 p-4' role='main' aria-label='Post event feedback page'>
      <div>
        <h1 className='font-heading text-2xl font-bold'>Post Event Feedback</h1>
        <p className='text-sm text-white/70'>Shown after exit scan. Gemini sentiment powers admin analytics.</p>
      </div>
      <Rating label='Overall' value={rating} onChange={setRating} />
      <Rating label='Crowd management' value={crowdRating} onChange={setCrowdRating} />
      <Rating label='Food' value={foodRating} onChange={setFoodRating} />
      <Rating label='Safety' value={safetyRating} onChange={setSafetyRating} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className='min-h-32 w-full rounded-md border border-white/10 bg-white/10 p-3'
        placeholder='Tell us about your experience'
        aria-label='Feedback comment'
      />
      <button className='w-full rounded-md bg-primary p-3 font-bold' onClick={submit}>
        Submit Feedback
      </button>
      {message ? <p className='rounded-md bg-white/10 p-3 text-sm'>{message}</p> : null}
    </PageTransition>
  );
}
