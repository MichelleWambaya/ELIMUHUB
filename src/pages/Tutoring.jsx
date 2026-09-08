import { useState } from 'react';
import { api } from '../lib/api';
import BackLink from '../components/BackLink';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Tutoring() {
  const [form, setForm] = useState({
    bio: '',
    subjects: '',
    education_levels: '',
    qualifications: '',
    years_experience: '',
    teaching_mode: 'online',
    location: '',
    hourly_rate_kes: '',
  });
  const [slots, setSlots] = useState([{ day_of_week: 1, start_time: '16:00', end_time: '18:00' }]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  function updateSlot(i, field, value) {
    setSlots((s) => s.map((slot, idx) => (idx === i ? { ...slot, [field]: value } : slot)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setStatus('saving');
    try {
      await api.post('/tutors/profile', {
        ...form,
        subjects: form.subjects.split(',').map((s) => s.trim()).filter(Boolean),
        education_levels: form.education_levels.split(',').map((s) => s.trim()).filter(Boolean),
        years_experience: form.years_experience ? Number(form.years_experience) : null,
        hourly_rate_kes: Number(form.hourly_rate_kes || 0),
      });
      await api.post('/tutors/availability', { slots: slots.map((s) => ({ ...s, day_of_week: Number(s.day_of_week) })) });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus('');
    }
  }

  return (
    <div className="max-w-lg">
      <BackLink to="/dashboard" label="Back to dashboard" />
      <h1 className="text-2xl font-semibold mb-2">Tutoring</h1>
      <p className="text-muted text-sm mb-6">Set up your subjects, rate, and availability so students can book you.</p>

      {saved && <p className="text-sm text-accent mb-4">Saved. You're now listed under Find a tutor.</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          placeholder="Short bio"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          className="w-full bg-surface border border-border rounded-md px-4 py-2 h-24 focus:border-accent outline-none"
        />
        <input
          placeholder="Subjects, comma separated (e.g. Math, Chemistry)"
          value={form.subjects}
          onChange={(e) => setForm({ ...form, subjects: e.target.value })}
          className="w-full bg-surface border border-border rounded-md px-4 py-2 focus:border-accent outline-none"
        />
        <input
          placeholder="Education levels, comma separated (e.g. KCSE, IGCSE)"
          value={form.education_levels}
          onChange={(e) => setForm({ ...form, education_levels: e.target.value })}
          className="w-full bg-surface border border-border rounded-md px-4 py-2 focus:border-accent outline-none"
        />
        <input
          placeholder="Qualifications"
          value={form.qualifications}
          onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
          className="w-full bg-surface border border-border rounded-md px-4 py-2 focus:border-accent outline-none"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Years of experience"
            value={form.years_experience}
            onChange={(e) => setForm({ ...form, years_experience: e.target.value })}
            className="bg-surface border border-border rounded-md px-4 py-2 focus:border-accent outline-none"
          />
          <input
            type="number"
            placeholder="Rate per hour (KES)"
            value={form.hourly_rate_kes}
            onChange={(e) => setForm({ ...form, hourly_rate_kes: e.target.value })}
            className="bg-surface border border-border rounded-md px-4 py-2 focus:border-accent outline-none"
            required
          />
        </div>
        <div className="flex gap-3">
          {['online', 'in_person', 'both'].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setForm({ ...form, teaching_mode: mode })}
              className={`flex-1 border rounded-md py-2 text-sm capitalize transition-colors ${
                form.teaching_mode === mode ? 'border-accent text-accent' : 'border-border text-muted'
              }`}
            >
              {mode.replace('_', ' ')}
            </button>
          ))}
        </div>
        {form.teaching_mode !== 'online' && (
          <input
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full bg-surface border border-border rounded-md px-4 py-2 focus:border-accent outline-none"
          />
        )}

        <div>
          <p className="text-sm font-medium mb-2">Weekly availability</p>
          {slots.map((slot, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <select
                value={slot.day_of_week}
                onChange={(e) => updateSlot(i, 'day_of_week', e.target.value)}
                className="bg-surface border border-border rounded-md px-2 py-2 text-sm"
              >
                {DAYS.map((d, idx) => (
                  <option key={d} value={idx}>{d}</option>
                ))}
              </select>
              <input
                type="time"
                value={slot.start_time}
                onChange={(e) => updateSlot(i, 'start_time', e.target.value)}
                className="bg-surface border border-border rounded-md px-2 py-2 text-sm flex-1"
              />
              <input
                type="time"
                value={slot.end_time}
                onChange={(e) => updateSlot(i, 'end_time', e.target.value)}
                className="bg-surface border border-border rounded-md px-2 py-2 text-sm flex-1"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSlots((s) => [...s, { day_of_week: 1, start_time: '16:00', end_time: '18:00' }])}
            className="text-sm text-accent hover:underline"
          >
            + Add another slot
          </button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={status === 'saving'}
          className="bg-accent text-bg font-medium px-6 py-2 rounded-md hover:bg-accentDim transition-colors disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving...' : 'Save tutoring profile'}
        </button>
      </form>
    </div>
  );
}
