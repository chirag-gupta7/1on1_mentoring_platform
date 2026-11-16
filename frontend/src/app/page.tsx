import Link from 'next/link'
import { Code2, Video, Terminal, Clock, Globe, Lock, ArrowRight } from 'lucide-react'

const features = [
  {
    icon: Code2,
    title: 'Real-Time Collaboration',
    description:
      'Share a code editor with your mentor and collaborate on code in real-time with synchronized editing.',
  },
  {
    icon: Video,
    title: 'Video Call Sessions',
    description:
      'Connect face-to-face with mentors through built-in WebRTC video calls for seamless communication.',
  },
  {
    icon: Terminal,
    title: 'Smart Code Editor',
    description:
      'Full-featured Monaco editor with syntax highlighting, auto-completion, and multi-language support.',
  },
  {
    icon: Clock,
    title: 'Session History',
    description:
      'Track your learning journey with detailed session history, notes, and code snapshots.',
  },
  {
    icon: Globe,
    title: 'Multi-Language Support',
    description:
      'Code in Python, JavaScript, TypeScript, Go, Rust, Java, and many more languages.',
  },
  {
    icon: Lock,
    title: 'Secure & Private',
    description:
      'End-to-end encrypted sessions with JWT authentication ensure your data stays private.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <Link
          href="/"
          className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent"
        >
          MentorHub
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2 rounded-lg text-gray-300 hover:text-white transition-colors duration-200"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold transition-all duration-200"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section className="relative max-w-4xl mx-auto text-center pt-20 pb-16 px-6">
        <div
          className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent rounded-full blur-3xl -z-10"
          style={{ transform: 'scale(1.5)' }}
        />
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
          Learn from the Best.{' '}
          <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Code Together in Real-Time.
          </span>
        </h1>
        <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
          A collaborative mentoring platform with live video, shared code editor, and real-time chat.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold text-lg transition-all duration-200 shadow-lg shadow-blue-500/25"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg border border-[#334155] text-gray-300 hover:text-white hover:border-blue-500/50 font-semibold text-lg transition-all duration-200"
          >
            Browse Mentors
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything You Need to{' '}
          <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Excel
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-xl bg-[#1a1a2e] border border-[#1e293b] hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors duration-300">
                <feature.icon className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#1e293b] py-8 px-6 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} MentorHub. All rights reserved.</p>
      </footer>
    </div>
  )
}
