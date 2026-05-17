'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Ticket, Search, BarChart3, Users, Zap, Shield, ArrowRight, 
  CheckCircle2, Star, MessageSquare, Phone, Mail, 
  ChevronRight, Sparkles, Globe, Clock, TrendingUp
} from 'lucide-react';
import styles from './landing.module.css';

/* ───── Animated Counter ───── */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const step = target / 60;
          const timer = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(start));
          }, 16);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ───── Feature Card ───── */
function FeatureCard({ icon: Icon, title, desc, delay }: { icon: React.ElementType; title: string; desc: string; delay: number }) {
  return (
    <div className={styles.featureCard} style={{ animationDelay: `${delay}ms` }}>
      <div className={styles.featureIcon}><Icon size={24} /></div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

/* ───── Step Card ───── */
function StepCard({ number, title, desc }: { number: number; title: string; desc: string }) {
  return (
    <div className={styles.stepCard}>
      <div className={styles.stepNumber}>{number}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

/* ───── Testimonial Card ───── */
function TestimonialCard({ name, role, quote, rating }: { name: string; role: string; quote: string; rating: number }) {
  return (
    <div className={styles.testimonialCard}>
      <div className={styles.stars}>
        {Array.from({ length: rating }).map((_, i) => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
      </div>
      <p className={styles.quote}>&ldquo;{quote}&rdquo;</p>
      <div className={styles.author}>
        <div className={styles.avatar}>{name[0]}</div>
        <div><strong>{name}</strong><span>{role}</span></div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* LANDING PAGE                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={styles.page}>
      {/* ───── Navbar ───── */}
      <nav className={`${styles.nav} ${scrollY > 50 ? styles.navScrolled : ''}`}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}><Ticket size={20} /></div>
            <span>SupportDesk</span>
          </Link>
          <div className={styles.navLinks}>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#testimonials">Testimonials</a>
          </div>
          <div className={styles.navActions}>
            <Link href="/login" className="btn btn-ghost">Sign In</Link>
            <Link href="/register" className="btn btn-primary">Get Started <ArrowRight size={16} /></Link>
          </div>
        </div>
      </nav>

      {/* ───── Hero ───── */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.heroOrb1} />
          <div className={styles.heroOrb2} />
          <div className={styles.heroOrb3} />
          <div className={styles.gridOverlay} />
        </div>

        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <Sparkles size={14} />
            <span>Powered by Google Sheets & Apps Script</span>
          </div>
          <h1>
            Customer Support,<br />
            <span className={styles.gradient}>Reimagined.</span>
          </h1>
          <p className={styles.heroSub}>
            A professional-grade ticketing CRM that transforms Google Sheets into a powerful 
            support engine. Track tickets, collaborate with your team, and delight customers — 
            all from one beautiful interface.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/register" className="btn btn-primary btn-lg">
              Start Free <ArrowRight size={18} />
            </Link>
            <a href="#features" className="btn btn-secondary btn-lg">
              Explore Features <ChevronRight size={18} />
            </a>
          </div>
          <div className={styles.heroStats}>
            <div><strong><Counter target={10000} suffix="+" /></strong><span>Tickets Managed</span></div>
            <div className={styles.statDivider} />
            <div><strong><Counter target={99} suffix="%" /></strong><span>Uptime</span></div>
            <div className={styles.statDivider} />
            <div><strong><Counter target={5} /></strong><span>Channels Supported</span></div>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className={styles.heroPreview}>
          <div className={styles.previewWindow}>
            <div className={styles.windowBar}>
              <span /><span /><span />
              <div className={styles.windowUrl}>supportdesk.app/dashboard</div>
            </div>
            <div className={styles.previewContent}>
              <div className={styles.previewSidebar}>
                <div className={styles.pNavItem} data-active="true">📊 Dashboard</div>
                <div className={styles.pNavItem}>🎫 Tickets</div>
                <div className={styles.pNavItem}>👥 Customers</div>
                <div className={styles.pNavItem}>📦 Orders</div>
                <div className={styles.pNavItem}>⚙️ Settings</div>
              </div>
              <div className={styles.previewMain}>
                <div className={styles.pKpiRow}>
                  <div className={styles.pKpi}><span>250</span><small>Total</small></div>
                  <div className={styles.pKpi} data-color="blue"><span>45</span><small>Open</small></div>
                  <div className={styles.pKpi} data-color="green"><span>180</span><small>Resolved</small></div>
                  <div className={styles.pKpi} data-color="red"><span>4.2%</span><small>SLA Breach</small></div>
                </div>
                <div className={styles.pChart}>
                  <div className={styles.chartBar} style={{ height: '40%' }} />
                  <div className={styles.chartBar} style={{ height: '65%' }} />
                  <div className={styles.chartBar} style={{ height: '50%' }} />
                  <div className={styles.chartBar} style={{ height: '80%' }} />
                  <div className={styles.chartBar} style={{ height: '35%' }} />
                  <div className={styles.chartBar} style={{ height: '90%' }} />
                  <div className={styles.chartBar} style={{ height: '55%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Features ───── */}
      <section id="features" className={styles.features}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionBadge}>Features</span>
          <h2>Everything you need to deliver<br /><span className={styles.gradient}>exceptional support</span></h2>
          <p>Built with real-world support workflows in mind.</p>
        </div>
        <div className={styles.featureGrid}>
          <FeatureCard icon={Ticket} title="Smart Ticketing" desc="Create, track, and resolve tickets with automatic ID generation, SLA tracking, and status workflows." delay={0} />
          <FeatureCard icon={Search} title="Powerful Search" desc="Find any ticket instantly by ID, customer name, email, phone, or order number with real-time results." delay={100} />
          <FeatureCard icon={BarChart3} title="Live Analytics" desc="Real-time dashboard with KPIs, trend charts, channel distribution, and agent performance leaderboards." delay={200} />
          <FeatureCard icon={Users} title="Team Collaboration" desc="Assign tickets to agents, escalate to departments, and track team workload across buckets." delay={300} />
          <FeatureCard icon={Zap} title="Multi-Channel" desc="Handle support from WhatsApp, Instagram, Facebook, Email, and Phone — all in one unified inbox." delay={400} />
          <FeatureCard icon={Shield} title="Role-Based Access" desc="Admin and Agent roles with different dashboards, permissions, and management capabilities." delay={500} />
        </div>
      </section>

      {/* ───── How It Works ───── */}
      <section id="how-it-works" className={styles.howItWorks}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionBadge}>How It Works</span>
          <h2>Three simple steps to<br /><span className={styles.gradient}>support excellence</span></h2>
        </div>
        <div className={styles.stepsGrid}>
          <StepCard number={1} title="Create Tickets" desc="Customers reach out via any channel. Create tickets with full context — contact info, order links, and priority levels." />
          <div className={styles.stepConnector}><ChevronRight size={24} /></div>
          <StepCard number={2} title="Track & Collaborate" desc="Assign to the right agent, add comments, escalate when needed. Real-time sync keeps everyone on the same page." />
          <div className={styles.stepConnector}><ChevronRight size={24} /></div>
          <StepCard number={3} title="Resolve & Report" desc="Close tickets with resolution notes. Analytics dashboard shows trends, SLA compliance, and team performance." />
        </div>
      </section>

      {/* ───── Channels ───── */}
      <section className={styles.channels}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionBadge}>Multi-Channel</span>
          <h2>One inbox for <span className={styles.gradient}>every channel</span></h2>
        </div>
        <div className={styles.channelGrid}>
          <div className={styles.channelCard}><MessageSquare size={32} /><span>WhatsApp</span></div>
          <div className={styles.channelCard}><Globe size={32} /><span>Instagram</span></div>
          <div className={styles.channelCard}><Users size={32} /><span>Facebook</span></div>
          <div className={styles.channelCard}><Mail size={32} /><span>Email</span></div>
          <div className={styles.channelCard}><Phone size={32} /><span>Calls</span></div>
        </div>
      </section>

      {/* ───── Tech Stack ───── */}
      <section className={styles.techStack}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionBadge}>Technology</span>
          <h2>Built on <span className={styles.gradient}>modern infrastructure</span></h2>
        </div>
        <div className={styles.techGrid}>
          <div className={styles.techCard}>
            <div className={styles.techIcon}>📊</div>
            <h4>Google Sheets</h4>
            <p>Scalable database with built-in formulas and data validation</p>
          </div>
          <div className={styles.techCard}>
            <div className={styles.techIcon}>⚡</div>
            <h4>Apps Script</h4>
            <p>Serverless backend with caching, auth, and REST API routing</p>
          </div>
          <div className={styles.techCard}>
            <div className={styles.techIcon}>⚛️</div>
            <h4>Next.js + React</h4>
            <p>Modern frontend with TypeScript, SSR, and App Router</p>
          </div>
          <div className={styles.techCard}>
            <div className={styles.techIcon}>☁️</div>
            <h4>Google Drive</h4>
            <p>File attachment storage with shareable links</p>
          </div>
        </div>
      </section>

      {/* ───── Testimonials ───── */}
      <section id="testimonials" className={styles.testimonials}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionBadge}>Testimonials</span>
          <h2>Loved by <span className={styles.gradient}>support teams</span></h2>
        </div>
        <div className={styles.testimonialGrid}>
          <TestimonialCard name="Alex Morgan" role="Support Lead, Acme Corp" quote="SupportDesk transformed how we handle customer issues. The three-panel interface makes it incredibly fast to triage and resolve tickets." rating={5} />
          <TestimonialCard name="Priya Sharma" role="CTO, StartupHQ" quote="Using Google Sheets as the backend is brilliant. Our team can access data directly when needed, and the CRM interface handles everything else." rating={5} />
          <TestimonialCard name="James Wilson" role="Operations Manager, TechFlow" quote="The analytics dashboard alone is worth it. We reduced our average resolution time by 40% in the first month." rating={5} />
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2>Ready to transform your<br /><span className={styles.gradient}>customer support?</span></h2>
          <p>Join teams using SupportDesk to deliver faster, smarter support.</p>
          <div className={styles.ctaActions}>
            <Link href="/register" className="btn btn-primary btn-lg">
              Get Started Free <ArrowRight size={18} />
            </Link>
          </div>
          <div className={styles.ctaFeatures}>
            <span><CheckCircle2 size={16} /> No credit card required</span>
            <span><Clock size={16} /> Setup in 5 minutes</span>
            <span><TrendingUp size={16} /> Free forever</span>
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}><Ticket size={20} /></div>
              <span>SupportDesk</span>
            </div>
            <p>Professional customer support CRM powered by Google Sheets & Apps Script.</p>
          </div>
          <div className={styles.footerLinks}>
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#testimonials">Testimonials</a>
          </div>
          <div className={styles.footerLinks}>
            <h4>Resources</h4>
            <a href="#">Documentation</a>
            <a href="#">API Reference</a>
            <a href="#">GitHub</a>
          </div>
          <div className={styles.footerLinks}>
            <h4>Contact</h4>
            <a href="mailto:support@supportdesk.app">support@supportdesk.app</a>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>© {new Date().getFullYear()} SupportDesk CRM. Built for Datastraw Assessment.</p>
        </div>
      </footer>
    </div>
  );
}
