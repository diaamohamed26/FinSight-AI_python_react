
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Wallet,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Loader2,
  CheckCircle2,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'

export default function Auth() {
  const navigate = useNavigate()
  const { login, register } = useAuth()

  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const isLogin = mode === 'login'

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setSuccess('')
    setForm({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!isLogin && form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!isLogin && form.password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      if (isLogin) {
        await login(form.email, form.password)
      } else {
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
        })

        setSuccess('Account created successfully. Welcome to FinSight AI!')
      }

      navigate('/', { replace: true })
    } catch (err) {
      const detail = err.response?.data?.detail

      setError(
        Array.isArray(detail)
          ? detail.map((item) => item.msg).join(', ')
          : detail || 'Something went wrong. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-600'

  const inputWrapper =
    'flex items-center gap-3 rounded-xl border border-white/10 bg-[#080b12] px-4 transition focus-within:border-emerald-400/50'

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080b12] px-4 py-10">
      {/* Background effects */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-emerald-400/[0.07] blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-emerald-400/[0.05] blur-[120px]" />

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0d111b] shadow-2xl lg:grid-cols-2">

        {/* Left Side - Branding */}
        <section className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-[#0a1018] p-12 lg:flex">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400 text-[#07110c]">
                <Wallet size={23} />
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">
                  FinSight<span className="text-emerald-400"> AI</span>
                </h2>
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
                  Financial Intelligence
                </p>
              </div>
            </Link>

            <div className="mt-24 max-w-md">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-2 text-xs font-medium text-emerald-400">
                <Sparkles size={14} />
                Smarter Financial Decisions
              </div>

              <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
                Take control of your money.
                <span className="text-emerald-400">
                  {' '}Build your future.
                </span>
              </h1>

              <p className="mt-6 text-sm leading-7 text-slate-400">
                Track your income, understand your spending,
                manage budgets, and make smarter financial
                decisions with AI-powered insights.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              'Smart financial analytics',
              'Personalized AI insights',
              'Secure financial management',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle2 size={17} className="text-emerald-400" />
                <span className="text-sm text-slate-400">{feature}</span>
              </div>
            ))}

            <p className="border-t border-white/[0.06] pt-6 text-xs text-slate-600">
              © 2026 FinSight AI. All rights reserved.
            </p>
          </div>

          <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full border border-emerald-400/[0.07]" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-52 w-52 rounded-full border border-emerald-400/[0.07]" />
        </section>

        {/* Right Side - Authentication */}
        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">

            {/* Mobile Logo */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400 text-[#07110c]">
                <Wallet size={23} />
              </div>
              <h2 className="text-xl font-bold text-white">
                FinSight<span className="text-emerald-400"> AI</span>
              </h2>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
                {isLogin ? <Lock size={22} /> : <User size={22} />}
              </div>

              <h2 className="text-3xl font-bold text-white">
                {isLogin ? 'Welcome back' : 'Create your account'}
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                {isLogin
                  ? 'Enter your credentials to access your dashboard.'
                  : 'Start managing your finances with FinSight AI.'}
              </p>
            </div>

            {/* Tabs */}
            <div className="mb-7 grid grid-cols-2 rounded-xl border border-white/[0.06] bg-[#080b12] p-1">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`rounded-lg py-2.5 text-sm font-medium transition ${
                  isLogin
                    ? 'bg-emerald-400 text-[#07110c]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`rounded-lg py-2.5 text-sm font-medium transition ${
                  !isLogin
                    ? 'bg-emerald-400 text-[#07110c]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/[0.08] p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] p-3 text-sm text-emerald-400">
                {success}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {!isLogin && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Full Name
                  </label>

                  <div className={inputWrapper}>
                    <User size={18} className="shrink-0 text-slate-500" />
                    <input
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      required
                      minLength={2}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email Address
                </label>

                <div className={inputWrapper}>
                  <Mail size={18} className="shrink-0 text-slate-500" />
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Password
                </label>

                <div className={inputWrapper}>
                  <Lock size={18} className="shrink-0 text-slate-500" />

                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    required
                    minLength={8}
                    className={inputClass}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-500 transition hover:text-white"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Confirm Password
                  </label>

                  <div className={inputWrapper}>
                    <ShieldCheck size={18} className="shrink-0 text-slate-500" />

                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      className={inputClass}
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-slate-500 transition hover:text-white"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {isLogin && (
                <div className="flex justify-end">
                  <span className="text-xs text-slate-500">
                    Forgot password? Contact support.
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3.5 text-sm font-bold text-[#07110c] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Please wait...
                  </>
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-500">
              {isLogin
                ? "Don't have an account?"
                : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => switchMode(isLogin ? 'register' : 'login')}
                className="font-semibold text-emerald-400 hover:text-emerald-300"
              >
                {isLogin ? 'Create account' : 'Sign in'}
              </button>
            </p>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-600">
              <ShieldCheck size={15} />
              Your account is protected with secure authentication.
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
