import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setError(error.message);

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    navigate(profile?.role === 'admin' ? '/admin' : '/dashboard');
  }

  return (
    <div className="max-w-sm mx-auto mt-24 px-6">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-surface border border-border rounded-md px-4 py-2 focus:border-accent outline-none"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-surface border border-border rounded-md px-4 py-2 focus:border-accent outline-none"
          required
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="w-full bg-accent text-bg font-medium py-2 rounded-md hover:bg-accentDim transition-colors">
          Log in
        </button>
      </form>
    </div>
  );
}
