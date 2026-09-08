import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import BackLink from '../components/BackLink';

export default function UploadResource() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    price_kes: '',
    category_id: '',
    subject_id: '',
    education_level_id: '',
  });
  const [taxonomy, setTaxonomy] = useState({ categories: [], subjects: [], education_levels: [] });
  const [resourceId, setResourceId] = useState(null);
  const [file, setFile] = useState(null);
  const [cover, setCover] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const commission = form.price_kes ? Math.round(Number(form.price_kes) * 0.5) : 0;
  const earnings = form.price_kes ? Number(form.price_kes) - commission : 0;

  useEffect(() => {
    api.get('/taxonomy').then(setTaxonomy);
  }, []);

  async function handleCreateDraft(e) {
    e.preventDefault();
    setError('');
    try {
      const { resource } = await api.post('/resources', {
        ...form,
        price_kes: Number(form.price_kes),
        category_id: form.category_id || null,
        subject_id: form.subject_id || null,
        education_level_id: form.education_level_id || null,
      });
      setResourceId(resource.id);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUploadFile() {
    if (!file || !resourceId) return;
    setStatus('uploading-file');
    try {
      const body = new FormData();
      body.append('file', file);
      const data = await api.upload(`/resources/${resourceId}/files`, body);
      setUploadedFiles((f) => [...f, data.file]);
      setFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus('');
    }
  }

  async function handleUploadCover() {
    if (!cover || !resourceId) return;
    setStatus('uploading-cover');
    try {
      const body = new FormData();
      body.append('cover', cover);
      await api.upload(`/resources/${resourceId}/cover`, body);
      setCover(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus('');
    }
  }

  async function handleSubmitForReview() {
    setStatus('submitting');
    try {
      await api.post(`/resources/${resourceId}/submit`, {});
      setStatus('submitted');
    } catch (err) {
      setError(err.message);
      setStatus('');
    }
  }

  if (status === 'submitted') {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold mb-2">Submitted for review</h1>
        <p className="text-muted">You'll see the decision on your dashboard once a moderator reviews it.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <BackLink to="/dashboard" label="Back to dashboard" />
      <h1 className="text-2xl font-semibold mb-6">Upload a resource</h1>

      {!resourceId ? (
        <form onSubmit={handleCreateDraft} className="space-y-4">
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-surface border border-border rounded-md px-4 py-2 focus:border-accent outline-none"
            required
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-surface border border-border rounded-md px-4 py-2 h-32 focus:border-accent outline-none"
            required
          />

          <div className="grid grid-cols-3 gap-3">
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="bg-surface border border-border rounded-md px-3 py-2 text-sm focus:border-accent outline-none"
            >
              <option value="">Category</option>
              {taxonomy.categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={form.subject_id}
              onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
              className="bg-surface border border-border rounded-md px-3 py-2 text-sm focus:border-accent outline-none"
            >
              <option value="">Subject</option>
              {taxonomy.subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              value={form.education_level_id}
              onChange={(e) => setForm({ ...form, education_level_id: e.target.value })}
              className="bg-surface border border-border rounded-md px-3 py-2 text-sm focus:border-accent outline-none"
            >
              <option value="">Level</option>
              {taxonomy.education_levels.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <input
            type="number"
            placeholder="Price in KES"
            value={form.price_kes}
            onChange={(e) => setForm({ ...form, price_kes: e.target.value })}
            className="w-full bg-surface border border-border rounded-md px-4 py-2 focus:border-accent outline-none"
            required
          />

          {form.price_kes && (
            <div className="bg-surface2 border border-border rounded-md p-4 text-sm space-y-1">
              <p className="text-muted">Selling price: KES {Number(form.price_kes).toLocaleString()}</p>
              <p className="text-muted">Platform commission: KES {commission.toLocaleString()}</p>
              <p className="text-accent font-medium">You earn: KES {earnings.toLocaleString()}</p>
              <p className="text-xs text-muted pt-1">Actual payout may account for payment fees, refunds or taxes.</p>
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button type="submit" className="bg-accent text-bg font-medium px-6 py-2 rounded-md hover:bg-accentDim transition-colors">
            Continue to files
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium mb-2">Cover image</p>
            <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files[0])} className="text-sm text-muted" />
            <button
              onClick={handleUploadCover}
              disabled={!cover || status === 'uploading-cover'}
              className="ml-3 text-sm border border-border px-3 py-1.5 rounded-md hover:border-accent disabled:opacity-50"
            >
              {status === 'uploading-cover' ? 'Uploading...' : 'Upload cover'}
            </button>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Resource file</p>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} className="text-sm text-muted" />
            <button
              onClick={handleUploadFile}
              disabled={!file || status === 'uploading-file'}
              className="ml-3 text-sm border border-border px-3 py-1.5 rounded-md hover:border-accent disabled:opacity-50"
            >
              {status === 'uploading-file' ? 'Uploading...' : 'Upload file'}
            </button>
            {uploadedFiles.length > 0 && (
              <ul className="mt-2 text-sm text-muted">
                {uploadedFiles.map((f) => (
                  <li key={f.id}>{f.file_name}</li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            onClick={handleSubmitForReview}
            disabled={uploadedFiles.length === 0 || status === 'submitting'}
            className="bg-accent text-bg font-medium px-6 py-2 rounded-md hover:bg-accentDim transition-colors disabled:opacity-50"
          >
            {status === 'submitting' ? 'Submitting...' : 'Submit for review'}
          </button>
          {uploadedFiles.length === 0 && <p className="text-xs text-muted">Upload at least one file before submitting.</p>}
        </div>
      )}
    </div>
  );
}
