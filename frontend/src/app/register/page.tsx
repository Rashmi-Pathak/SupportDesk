'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Ticket, User, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import styles from '../login/auth.module.css';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    const res = await register(name, email, password);
    setLoading(false);
    if (res.success) {
      if (res.role === 'Customer') router.push('/portal');
      else router.push('/dashboard');
    } else {
      setError(res.error || 'Registration failed');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.leftPanel}>
        <div className={styles.leftContent}>
          <Link href="/" className={styles.backLogo}>
            <div className={styles.logoIcon}><Ticket size={20} /></div>
            <span>SupportDesk</span>
          </Link>
          <div className={styles.illustration}>
            <div className={styles.ilCircle1} />
            <div className={styles.ilCircle2} />
            <div className={styles.ilIcon}>🚀</div>
          </div>
          <h2>Join SupportDesk</h2>
          <p>Create your customer account and start getting support in minutes.</p>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <h1>Create Customer Account</h1>
          <p className={styles.formSub}>Register to submit support tickets and track their progress</p>

          {error && (
            <div className={styles.errorBox}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="name">Full Name</label>
            <div className={styles.inputWrap}>
              <User size={18} className={styles.inputIcon} />
              <input id="name" type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <div className={styles.inputWrap}>
              <Mail size={18} className={styles.inputIcon} />
              <input id="email" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <div className={styles.inputWrap}>
              <Lock size={18} className={styles.inputIcon} />
              <input id="password" type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="confirm">Confirm Password</label>
            <div className={styles.inputWrap}>
              <Lock size={18} className={styles.inputIcon} />
              <input id="confirm" type="password" placeholder="Re-enter password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
            {loading ? <Loader2 size={18} className={styles.spinning} /> : <>Create Account <ArrowRight size={18} /></>}
          </button>

          <p className={styles.switchLink}>
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
