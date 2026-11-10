
import { useEffect, useRef, useState } from 'react'
import {
  Bot,
  Send,
  Sparkles,
  User,
  Lightbulb,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import { aiAPI, getAPIError } from '../services/api'

const suggestions = [
  'Analyze my monthly expenses',
  'How can I increase my savings?',
  'Explain my cash flow',
  'Create a monthly budget plan',
]

const initialMessage = {
  role: 'assistant',
  text: "Hello! I'm your FinSight AI financial assistant. I can help you understand your spending, analyze your financial data, plan budgets, and improve your savings. What would you like to know?",
}

export default function AIAssistant() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([initialMessage])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const messagesEndRef = useRef(null)

  // Automatically scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, loading])

  // Send message to FastAPI + Groq
  async function sendMessage(text = input) {
    const question = text.trim()

    if (!question || loading) return

    setInput('')
    setError('')
    setLoading(true)

    setMessages((current) => [
      ...current,
      {
        role: 'user',
        text: question,
      },
    ])

    try {
      const response = await aiAPI.chat(question)

      const answer = response.data?.answer

      if (!answer) {
        throw new Error('The AI service returned an empty response.')
      }

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: answer,
        },
      ])
    } catch (err) {
      const errorMessage =
        err.message === 'The AI service returned an empty response.'
          ? err.message
          : getAPIError(err)

      setError(errorMessage)

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: 'I could not process your request right now. Please check the connection and try again.',
          isError: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Clear conversation
  function clearChat() {
    if (loading) return

    setMessages([initialMessage])
    setInput('')
    setError('')
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  return (
    <div>
      <PageHeader
        title="AI Financial Assistant"
        description="Your intelligent companion for financial questions and insights."
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_280px]">

        {/* Chat Section */}
        <section className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d111b]">

          {/* Chat Header */}
          <div className="flex items-center gap-3 border-b border-white/5 p-5">
            <div className="rounded-xl bg-emerald-400/10 p-2.5 text-emerald-400">
              <Bot size={22} />
            </div>

            <div>
              <h2 className="font-semibold text-white">
                FinSight AI
              </h2>

              <p className="text-xs text-slate-500">
                Powered by Groq AI
              </p>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-400">
                AI Assistant
              </span>

              <button
                type="button"
                onClick={clearChat}
                disabled={loading}
                title="Clear conversation"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-5 overflow-y-auto p-5">

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user'
                    ? 'flex-row-reverse'
                    : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    message.role === 'assistant'
                      ? 'bg-emerald-400/10 text-emerald-400'
                      : 'bg-slate-700 text-white'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <Bot size={19} />
                  ) : (
                    <User size={19} />
                  )}
                </div>

                {/* Message Content */}
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl p-4 text-sm leading-6 ${
                    message.role === 'assistant'
                      ? message.isError
                        ? 'border border-red-400/10 bg-red-400/[0.05] text-red-300'
                        : 'bg-white/[0.04] text-slate-300'
                      : 'bg-emerald-400 text-[#07110c]'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
                  <Bot size={19} />
                </div>

                <div className="flex items-center gap-2 rounded-2xl bg-white/[0.04] px-4 py-3 text-sm text-slate-400">
                  <Loader2 size={16} className="animate-spin text-emerald-400" />
                  FinSight AI is thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-4 mb-2 flex items-start gap-2 rounded-xl border border-red-400/10 bg-red-400/[0.05] p-3 text-xs text-red-300">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={(event) => {
              event.preventDefault()
              sendMessage()
            }}
            className="border-t border-white/5 p-4"
          >
            <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-[#080b12] p-2">

              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your finances..."
                rows={1}
                disabled={loading}
                className="max-h-32 min-h-10 min-w-0 flex-1 resize-y bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-slate-500 disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="rounded-lg bg-emerald-400 p-2.5 text-[#07110c] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>

            <p className="mt-2 px-2 text-[11px] text-slate-600">
              Press Enter to send · Shift + Enter for a new line
            </p>
          </form>
        </section>

        {/* Sidebar */}
        <aside className="h-fit rounded-2xl border border-white/[0.07] bg-[#0d111b] p-5">

          {/* Suggested Questions */}
          <div className="flex items-center gap-2 text-emerald-400">
            <Sparkles size={19} />
            <h3 className="font-semibold text-white">
              Suggested Questions
            </h3>
          </div>

          <div className="mt-5 space-y-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={loading}
                onClick={() => sendMessage(suggestion)}
                className="w-full rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left text-sm text-slate-400 transition hover:border-emerald-400/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Financial Tip */}
          <div className="mt-6 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.05] p-4">
            <Lightbulb size={19} className="text-emerald-400" />

            <p className="mt-3 text-sm font-medium text-white">
              Financial Tip
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Review your recurring expenses regularly to identify potential savings and improve your monthly budget.
            </p>
          </div>

          {/* AI Information */}
          <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-slate-300">
              <Bot size={17} />
              <span className="text-sm font-medium">
                About FinSight AI
              </span>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Your assistant uses your financial context to provide personalized spending analysis and budgeting suggestions.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
