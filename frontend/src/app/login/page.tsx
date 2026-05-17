'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Ticket, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import styles from './auth.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      // Route based on role
      if (res.role === 'Customer') router.push('/portal');
      else router.push('/dashboard');
    } else {
      setError(res.error || 'Login failed');
    }
  };

  const fillDemo = (role: 'admin' | 'agent' | 'customer') => {
    if (role === 'admin') {
      setEmail('admin@supportdesk.com');
      setPassword('admin123');
    } else if (role === 'agent') {
      setEmail('sarah@supportdesk.com');
      setPassword('agent123');
    } else {
      setEmail('customer1@example.com');
      setPassword('customer123');
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
            <div className={styles.ilIcon}>🎫</div>
          </div>
          <h2>Welcome back</h2>
          <p>Sign in to manage your support tickets and collaborate with your team.</p>

          <div className={styles.demoCredentials}>
            <span className={styles.demoLabel}>Quick Demo Login</span>
            <button className={styles.demoBtn} onClick={() => fillDemo('admin')}>
              🛡️ Admin Account
            </button>
            <button className={styles.demoBtn} onClick={() => fillDemo('agent')}>
              👤 Agent Account
            </button>
            <button className={styles.demoBtn} onClick={() => fillDemo('customer')}>
              🧑 Customer Account
            </button>
          </div>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <h1>Sign In</h1>
          <p className={styles.formSub}>Enter your credentials to access the dashboard</p>

          {error && (
            <div className={styles.errorBox}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

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
              <input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
            {loading ? <Loader2 size={18} className={styles.spinning} /> : <>Sign In <ArrowRight size={18} /></>}
          </button>

          <p className={styles.switchLink}>
            Don&apos;t have an account? <Link href="/register">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
