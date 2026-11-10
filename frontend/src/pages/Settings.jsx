
import { useCallback, useEffect, useState } from 'react'
import {
  User,
  Bell,
  Shield,
  Palette,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import { settingsAPI, getAPIError } from '../services/api'

const initialProfile = {
  name: '',
  email: '',
  currency: 'EGP',
  accountType: 'Personal',
}

const initialNotifications = {
  transactions: true,
  budgets: true,
  reports: false,
  aiInsights: true,
}

export default function Settings() {
  const [profile, setProfile] = useState(initialProfile)
  const [notifications, setNotifications] = useState(initialNotifications)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  // ==========================================
  // Load Settings
  // ==========================================

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const response = await settingsAPI.get()
      const data = response.data

      const serverProfile = data.profile || {}
      const serverNotifications = data.notifications || {}

      setProfile({
        name: serverProfile.name || '',
        email: serverProfile.email || '',
        currency: serverProfile.currency || 'EGP',
        accountType:
          serverProfile.account_type ||
          serverProfile.accountType ||
          'Personal',
      })

      setNotifications({
        ...initialNotifications,
        ...serverNotifications,
      })
    } catch (err) {
      setError(getAPIError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // ==========================================
  // Update Profile
  // ==========================================

  const updateProfile = (key, value) => {
    setProfile((previous) => ({
      ...previous,
      [key]: value,
    }))

    setSaved(false)
  }

  // ==========================================
  // Update Notifications
  // ==========================================

  const toggleNotification = (key) => {
    setNotifications((previous) => ({
      ...previous,
      [key]: !previous[key],
    }))

    setSaved(false)
  }

  // ==========================================
  // Save Settings
  // ==========================================

  const saveSettings = async (event) => {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')
      setSaved(false)

      await settingsAPI.update({
        profile: {
          name: profile.name,
          email: profile.email,
          currency: profile.currency,
          account_type: profile.accountType,
        },
        notifications,
      })

      setSaved(true)
    } catch (err) {
      setError(getAPIError(err))
    } finally {
      setSaving(false)
    }
  }

  // ==========================================
  // Loading
  // ==========================================

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Settings"
          description="Manage your profile, preferences and application settings."
        />

        <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
          <RefreshCw
            size={30}
            className="animate-spin text-emerald-400"
          />

          <p className="text-sm text-slate-400">
            Loading your settings...
          </p>
        </div>
      </div>
    )
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your profile, preferences and application settings."
      />

      <form onSubmit={saveSettings} className="max-w-3xl space-y-6">

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/5 p-4">
            <AlertCircle
              size={19}
              className="shrink-0 text-red-400"
            />

            <p className="text-sm text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* Profile Information */}
        <section className="rounded-2xl border border-white/[0.07] bg-[#0d111b] p-6">
          <div className="mb-6 flex items-center gap-3">
            <User className="text-emerald-400" size={20} />

            <h2 className="font-semibold text-white">
              Profile Information
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">

            <label className="text-sm text-slate-400">
              Full Name

              <input
                type="text"
                value={profile.name}
                onChange={(e) =>
                  updateProfile('name', e.target.value)
                }
                required
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#080b12] px-4 py-3 text-white outline-none focus:border-emerald-400"
                placeholder="Enter your full name"
              />
            </label>

            <label className="text-sm text-slate-400">
              Email Address

              <input
                type="email"
                value={profile.email}
                onChange={(e) =>
                  updateProfile('email', e.target.value)
                }
                required
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#080b12] px-4 py-3 text-white outline-none focus:border-emerald-400"
                placeholder="Enter your email"
              />
            </label>

            <label className="text-sm text-slate-400">
              Currency

              <select
                value={profile.currency}
                onChange={(e) =>
                  updateProfile('currency', e.target.value)
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#080b12] px-4 py-3 text-white outline-none focus:border-emerald-400"
              >
                <option value="EGP">EGP - Egyptian Pound</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="SAR">SAR - Saudi Riyal</option>
              </select>
            </label>

            <label className="text-sm text-slate-400">
              Account Type

              <select
                value={profile.accountType}
                onChange={(e) =>
                  updateProfile('accountType', e.target.value)
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#080b12] px-4 py-3 text-white outline-none focus:border-emerald-400"
              >
                <option value="Personal">Personal</option>
                <option value="Business">Business</option>
              </select>
            </label>

          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-2xl border border-white/[0.07] bg-[#0d111b] p-6">
          <div className="mb-6 flex items-center gap-3">
            <Bell className="text-emerald-400" size={20} />

            <h2 className="font-semibold text-white">
              Notifications
            </h2>
          </div>

          <div className="space-y-5">

            {[
              [
                'transactions',
                'Transaction notifications',
                'Receive updates about your transactions.',
              ],
              [
                'budgets',
                'Budget alerts',
                'Get notified when approaching budget limits.',
              ],
              [
                'reports',
                'Monthly reports',
                'Receive monthly financial summaries.',
              ],
              [
                'aiInsights',
                'AI financial insights',
                'Receive suggestions and financial insights.',
              ],
            ].map(([key, title, description]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {title}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {description}
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-label={title}
                  aria-checked={notifications[key]}
                  onClick={() => toggleNotification(key)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    notifications[key]
                      ? 'bg-emerald-400'
                      : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                      notifications[key]
                        ? 'left-6'
                        : 'left-1'
                    }`}
                  />
                </button>
              </div>
            ))}

          </div>
        </section>

        {/* Security and Privacy */}
        <section className="rounded-2xl border border-white/[0.07] bg-[#0d111b] p-6">
          <div className="flex items-center gap-3">
            <Shield className="text-emerald-400" size={20} />

            <h2 className="font-semibold text-white">
              Security & Privacy
            </h2>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Your account is protected using JWT authentication.
            Settings are saved through your authenticated backend API.
          </p>

          <div className="mt-5 flex items-center gap-3 text-xs text-slate-500">
            <Palette size={17} />

            FinSight AI · Dark Theme
          </div>
        </section>

        {/* Save Button */}
        <div className="flex flex-wrap items-center gap-4">

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-[#07110c] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}

            {saving ? 'Saving...' : 'Save Settings'}
          </button>

          {saved && (
            <span className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle size={17} />
              Settings saved successfully.
            </span>
          )}

        </div>
      </form>
    </div>
  )
}
