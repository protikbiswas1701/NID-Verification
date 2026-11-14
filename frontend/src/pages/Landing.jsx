import { Link } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle2, Database, FileLock2, ScanLine,
  ShieldCheck, ShieldX, Upload, Zap,
} from 'lucide-react';
import Button from '../components/Button';
import Logo from '../components/Logo';
import { homeFor, useAuth } from '../context/AuthContext';

const HOW_IT_WORKS = [
  {
    icon: Upload,
    title: 'Upload your NID card photo',
    text: 'Take a photo or upload an image of the front of your Bangladesh National ID card. The back side is optional.',
  },
  {
    icon: Zap,
    title: 'Instant AI analysis',
    text: 'Our engine runs OCR to extract the NID number, date of birth, and name, then cross-checks them against 115,000+ citizen records.',
  },
  {
    icon: CheckCircle2,
    title: 'Get a fraud verdict',
    text: 'Receive a detailed report: Genuine, Suspected Fake, or Unregistered — with the specific fraud signals that triggered the result.',
  },
];

const FEATURES = [
  {
    icon: Database,
    title: '115,000+ citizen records',
    text: 'NID numbers and dates of birth are verified against a national citizen registry for instant cross-matching.',
  },
  {
    icon: AlertTriangle,
    title: 'DOB mismatch detection',
    text: 'Flags cards where the printed date of birth doesn\'t match the registry entry for that NID number.',
  },
  {
    icon: ShieldX,
    title: '17-digit checksum validation',
    text: 'Smart cards encode the birth year in the first 4 digits. Mismatches reveal tampered or forged cards.',
  },
  {
    icon: ScanLine,
    title: 'ELA forensic analysis',
    text: 'Error Level Analysis detects image manipulation — pixel-level tampering of text or photo regions is flagged.',
  },
  {
    icon: FileLock2,
    title: 'Private & secure uploads',
    text: 'Images are stored privately with randomised file names. They are never exposed through a public URL.',
  },
  {
    icon: CheckCircle2,
    title: 'Full audit trail',
    text: 'Every verification is logged with its verdict, confidence score, and all extracted data for review.',
  },
];

const VERDICTS = [
  {
    label: 'VERIFIED GENUINE',
    color: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    dot: 'bg-emerald-500',
    desc: 'NID found in registry, DOB matches, no tampering detected.',
  },
  {
    label: 'SUSPECTED FAKE',
    color: 'bg-rose-50 text-rose-800 ring-rose-200',
    dot: 'bg-rose-500',
    desc: 'DOB mismatch, checksum failure, or image tampering found.',
  },
  {
    label: 'UNREGISTERED',
    color: 'bg-orange-50 text-orange-800 ring-orange-200',
    dot: 'bg-orange-400',
    desc: 'NID number not found in the citizen registry.',
  },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="bg-white">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#how" className="hover:text-navy-800">How it works</a>
            <a href="#features" className="hover:text-navy-800">Features</a>
            <a href="#security" className="hover:text-navy-800">Security</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link to={homeFor(user)}><Button size="sm">Open dashboard</Button></Link>
            ) : (
              <>
                <Link to="/login"><Button size="sm" variant="ghost">Log in</Button></Link>
                <Link to="/register"><Button size="sm">Get started</Button></Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-ice-300 ring-1 ring-white/20">
              <ShieldCheck size={12} /> Bangladesh NID Fraud Detection
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] text-white sm:text-5xl">
              Detect fake NID cards<br />in seconds.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-navy-200">
              Upload a photo of a Bangladesh National ID card. Our system uses OCR, a 115,000-record citizen registry, and forensic image analysis to instantly tell you if it's genuine or fake.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={user ? homeFor(user) : '/register'}>
                <Button variant="light" size="lg">{user ? 'Open dashboard' : 'Start verifying free'}</Button>
              </Link>
              {!user && (
                <Link to="/login">
                  <Button variant="secondary" size="lg" className="!bg-transparent !text-white !ring-white/30 hover:!bg-white/10">
                    Log in
                  </Button>
                </Link>
              )}
            </div>
            <p className="mt-6 max-w-xl text-xs text-navy-400">
              Not an official government service. For educational and fraud-screening purposes only.
            </p>
          </div>

          {/* Verdict preview card */}
          <div className="mx-auto w-full max-w-sm" aria-hidden="true">
            <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/15 space-y-3">
              {/* Mock NID card */}
              <div className="relative rounded-xl bg-navy-800 p-4">
                <span className="absolute left-2 top-2 h-5 w-5 rounded-tl-md border-l-2 border-t-2 border-ice-300" />
                <span className="absolute right-2 top-2 h-5 w-5 rounded-tr-md border-r-2 border-t-2 border-ice-300" />
                <span className="absolute bottom-2 left-2 h-5 w-5 rounded-bl-md border-b-2 border-l-2 border-ice-300" />
                <span className="absolute bottom-2 right-2 h-5 w-5 rounded-br-md border-b-2 border-r-2 border-ice-300" />
                <div className="grid grid-cols-[0.7fr_1.6fr] gap-3 py-2">
                  <div className="rounded-lg bg-white/10 aspect-[3/4]" />
                  <div className="space-y-2 pt-1">
                    <div className="h-2.5 w-full rounded bg-white/20" />
                    <div className="h-2.5 w-4/5 rounded bg-white/15" />
                    <div className="h-2.5 w-3/5 rounded bg-white/15" />
                    <div className="mt-3 h-2 w-2/3 rounded bg-white/10" />
                  </div>
                </div>
              </div>
              {/* Verdict badges */}
              {VERDICTS.map(v => (
                <div key={v.label} className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ring-1 ring-inset ${v.color}`}>
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${v.dot}`} />
                  <div>
                    <p className="text-xs font-bold tracking-wide">{v.label}</p>
                    <p className="text-xs opacity-80">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-extrabold">How it works</h2>
        <p className="mt-2 max-w-xl text-slate-600">Three steps from photo to fraud verdict.</p>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {HOW_IT_WORKS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="rounded-xl border border-slate-200 p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-navy-50 text-navy-700">
                  <Icon size={20} />
                </span>
                <span className="text-sm font-semibold text-slate-400">Step {i + 1}</span>
              </div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Features ── */}
      <section id="features" className="scroll-mt-16 bg-ice-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-extrabold">Detection capabilities</h2>
          <p className="mt-2 max-w-xl text-slate-600">Multiple layers of fraud detection working together.</p>
          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4">
                <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-navy-700 shadow-panel">
                  <Icon size={20} />
                </span>
                <div>
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security ── */}
      <section id="security" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-extrabold">Privacy & security</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              NID cards contain sensitive personal data. The app is built to keep it private.
            </p>
          </div>
          <ul className="space-y-4">
            {[
              'Images are stored in private storage with random file names and are never exposed through a public link.',
              'Every image request is authenticated: you can only access your own files.',
              'Uploads are validated by MIME type, file size, and actual file contents before saving.',
              'You can delete any verification at any time — images are deleted with it.',
              'All analysis runs locally on our server. Your NID image is never sent to a third-party AI service.',
            ].map((t) => (
              <li key={t} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-navy-600" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-navy-950 py-14 text-center text-white">
        <div className="mx-auto max-w-2xl px-4">
          <ScanLine className="mx-auto mb-4 text-ice-300" size={28} />
          <h2 className="text-2xl font-extrabold text-white">Ready to verify your first NID card?</h2>
          <p className="mt-3 text-navy-300">Free to use. No credit card required.</p>
          <div className="mt-6">
            <Link to={user ? homeFor(user) : '/register'}>
              <Button variant="light" size="lg">{user ? 'Open dashboard' : 'Create a free account'}</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo />
          <p className="max-w-md text-xs leading-relaxed">
            NID Verify is an independent fraud-detection tool. It is not affiliated with or an official service of the Bangladesh government or Election Commission.
          </p>
          <p className="text-xs">© {new Date().getFullYear()} NID Verify</p>
        </div>
      </footer>
    </div>
  );
}
