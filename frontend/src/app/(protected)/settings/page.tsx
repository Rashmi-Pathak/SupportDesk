'use client';
import { Settings, Database, Globe, Shield, Clock } from 'lucide-react';
import styles from '../pages.module.css';

export default function SettingsPage() {
  return (
    <div className={styles.fullPage}>
      <h2 style={{ marginBottom: 24 }}><Settings size={20} /> Settings</h2>
      <div className={styles.cardGrid}>
        <div className={styles.settingCard}>
          <div className={styles.settingIcon}><Database size={24} /></div>
          <h3>Database</h3>
          <p>Google Sheets backend connected. All data is stored and synced in real-time.</p>
          <div className={styles.settingMeta}><span className="badge badge-resolved">Connected</span></div>
        </div>
        <div className={styles.settingCard}>
          <div className={styles.settingIcon}><Globe size={24} /></div>
          <h3>API Endpoint</h3>
          <p>Google Apps Script deployed as web application handling all API requests.</p>
          <div className={styles.settingMeta}><span className="badge badge-resolved">Active</span></div>
        </div>
        <div className={styles.settingCard}>
          <div className={styles.settingIcon}><Shield size={24} /></div>
          <h3>Authentication</h3>
          <p>Token-based authentication with 24-hour expiry. Role-based access control enabled.</p>
          <div className={styles.settingMeta}><span className="badge badge-inprogress">Token Auth</span></div>
        </div>
        <div className={styles.settingCard}>
          <div className={styles.settingIcon}><Clock size={24} /></div>
          <h3>SLA Configuration</h3>
          <p>Low: 48h • Medium: 24h • High: 8h • Urgent: 4h</p>
          <div className={styles.settingMeta}><span className="badge badge-pending">Configured</span></div>
        </div>
      </div>
    </div>
  );
}
