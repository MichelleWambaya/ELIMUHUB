import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';

const ACCENT_SWATCHES = [
  { name: 'Green', value: '62 250 118' },
  { name: 'Blue', value: '77 163 255' },
  { name: 'Purple', value: '178 122 255' },
  { name: 'Amber', value: '255 176 59' },
  { name: 'Rose', value: '255 107 129' },
];

export default function Settings() {
  const { profile } = useAuth();
  const { preferences, updatePreferences } = useTheme();

  return (
    <div className="max-w-lg space-y-10">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section>
        <h2 className="text-lg font-medium mb-3">Account</h2>
        <div className="bg-surface border border-border rounded-lg p-4 text-sm">
          <p className="text-muted">Name</p>
          <p className="mb-3">{profile?.full_name}</p>
          <p className="text-muted">Role</p>
          <p className="capitalize">{profile?.role}</p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Appearance</h2>

        <p className="text-sm text-muted mb-2">Theme</p>
        <div className="flex gap-3 mb-6">
          {['dark', 'light'].map((t) => (
            <button
              key={t}
              onClick={() => updatePreferences({ theme: t })}
              className={`flex-1 border rounded-md py-2 text-sm capitalize transition-colors ${
                preferences.theme === t ? 'border-accent text-accent' : 'border-border text-muted'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <p className="text-sm text-muted mb-2">Accent color</p>
        <div className="flex gap-3">
          {ACCENT_SWATCHES.map((swatch) => (
            <button
              key={swatch.name}
              onClick={() => updatePreferences({ accent_color: swatch.value })}
              title={swatch.name}
              className="w-9 h-9 rounded-full border-2 transition-transform"
              style={{
                backgroundColor: `rgb(${swatch.value})`,
                borderColor: preferences.accent_color === swatch.value ? `rgb(${swatch.value})` : 'transparent',
                transform: preferences.accent_color === swatch.value ? 'scale(1.15)' : 'scale(1)',
              }}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Accessibility</h2>

        <p className="text-sm text-muted mb-2">Text size</p>
        <input
          type="range"
          min="0.85"
          max="1.3"
          step="0.05"
          value={preferences.font_scale}
          onChange={(e) => updatePreferences({ font_scale: Number(e.target.value) })}
          className="w-full mb-6 accent-accent"
        />

        <label className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <p className="text-sm">Reduce motion</p>
            <p className="text-xs text-muted">Turns off transitions and animations.</p>
          </div>
          <input
            type="checkbox"
            checked={preferences.reduce_motion}
            onChange={(e) => updatePreferences({ reduce_motion: e.target.checked })}
            className="w-5 h-5 accent-accent"
          />
        </label>

        <label className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm">High contrast</p>
            <p className="text-xs text-muted">Stronger borders and text contrast.</p>
          </div>
          <input
            type="checkbox"
            checked={preferences.high_contrast}
            onChange={(e) => updatePreferences({ high_contrast: e.target.checked })}
            className="w-5 h-5 accent-accent"
          />
        </label>
      </section>
    </div>
  );
}
