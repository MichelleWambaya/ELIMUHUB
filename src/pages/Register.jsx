import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Register() {
  const [params] = useSearchParams();
  const defaultRole = params.get('role') === 'teacher' ? 'teacher' : 'student';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(defaultRole);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return setError(error.message);

    const userId = data.user?.id;
    if (userId) {
      await supabase.from('profiles').insert({ id: userId, full_name: fullName, role });
      if (role === 'teacher') {
        await supabase.from('teacher_profiles').insert({ user_id: userId });
      }
    }

    navigate('/dashboard');
  }

  return (
    <div className="max-w-sm mx-auto mt-24 px-6">
      <h1 className="text-2xl font-semibold">Create an account</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full bg-surface border border-border rounded-md px-4 py-2 focus:border-accent outline-none"
          required
        />
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
        <div className="flex gap-3 text-sm">
          <RoleOption label="I'm a student" value="student" role={role} setRole={setRole} />
          <RoleOption label="I'm a teacher" value="teacher" role={role} setRole={setRole} />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="w-full bg-accent text-bg font-medium py-2 rounded-md hover:bg-accentDim transition-colors">
          Sign up
        </button>
      </form>
    </div>
  );
}

function RoleOption({ label, value, role, setRole }) {
  return (
    <button
      type="button"
      onClick={() => setRole(value)}
      className={`flex-1 border rounded-md py-2 transition-colors ${
        role === value ? 'border-accent text-accent' : 'border-border text-muted'
      }`}
    >
      {label}
    </button>
  );
}
