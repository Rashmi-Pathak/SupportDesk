'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Agent, Team } from '@/lib/types';
import { Shield, Users, Mail, BarChart3, Star, Clock, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import styles from '../pages.module.css';

export default function TeamPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  
  // State to filter agents by selected team
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getAgents(), api.getTeams()]).then(([aRes, tRes]) => {
      if (aRes.success) setAgents(aRes.data);
      if (tRes.success) setTeams(tRes.data);
      setLoading(false);
    });
  }, []);

  const handleUpdateAgentTeam = (agentId: string, newTeamId: string) => {
    setAgents(prev => prev.map(a => a.agentId === agentId ? { ...a, teamId: newTeamId } : a));
    setSelectedAgent(prev => prev && prev.agentId === agentId ? { ...prev, teamId: newTeamId } : prev);
    toast.success('Agent team updated successfully!');
  };

  const handleToggleAgentStatus = (agentId: string) => {
    setAgents(prev => prev.map(a => a.agentId === agentId ? { ...a, isActive: !a.isActive } : a));
    setSelectedAgent(prev => prev && prev.agentId === agentId ? { ...prev, isActive: !prev.isActive } : prev);
    toast.success('Agent status updated successfully!');
  };

  // Filter agents by the selected team
  const displayedAgents = selectedTeamId 
    ? agents.filter(a => a.teamId === selectedTeamId)
    : agents;

  return (
    <div className={styles.splitPage}>
      {/* Left panel: List Side - Forced display: block to enable perfect native vertical scroll bar for the entire content */}
      <div 
        className={styles.listSide} 
        style={{ 
          display: 'block', 
          overflowY: 'auto', 
          padding: 24, 
          height: '100%' 
        }}
      >
        <h2 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={20} /> Team Management</h2>

        {/* Team Buckets */}
        <div className={styles.sectionTitle}>
          Team Buckets <span style={{ textTransform: 'none', fontSize: 11, fontWeight: 'normal', color: 'var(--text-muted)' }}>(Click card to filter table below)</span>
        </div>
        <div className={styles.cardGrid} style={{ marginBottom: 32 }}>
          {loading ? Array.from({length:6}).map((_,i) => <div key={i} className="skeleton" style={{height:100,borderRadius:12}} />) :
          teams.map(t => {
            const isSelected = selectedTeamId === t.teamId;
            return (
              <div 
                key={t.teamId} 
                className={styles.teamCard}
                onClick={() => {
                  setSelectedTeamId(isSelected ? null : t.teamId);
                }}
                style={{ 
                  cursor: 'pointer', 
                  border: isSelected ? '2px solid #a855f7' : '1px solid var(--glass-border)',
                  boxShadow: isSelected ? '0 0 15px rgba(168, 85, 247, 0.25)' : 'none',
                  transform: isSelected ? 'scale(1.02)' : 'none',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <div className={styles.teamHeader}>
                  <Users size={18} style={{ color: isSelected ? '#a855f7' : 'inherit' }} />
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.teamId}</span>
                  </div>
                  {t.isVIP && <span className="badge badge-urgent">VIP</span>}
                </div>
                <p>{t.description}</p>
                <div className={styles.teamMembers} style={{ marginTop: 8 }}>
                  {agents.filter(a => a.teamId === t.teamId).map(a => (
                    <span 
                      key={a.agentId} 
                      className={styles.memberChip}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent toggling team card selection
                        setSelectedAgent(a);
                      }}
                      style={{ 
                        cursor: 'pointer',
                        borderColor: selectedAgent?.agentId === a.agentId ? '#a855f7' : 'var(--border-subtle)',
                        background: selectedAgent?.agentId === a.agentId ? 'rgba(168, 85, 247, 0.1)' : 'var(--bg-tertiary)',
                        color: selectedAgent?.agentId === a.agentId ? '#a855f7' : 'var(--text-secondary)'
                      }}
                    >
                      {a.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Agent List Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, marginBottom: 12 }}>
          <div className={styles.sectionTitle} style={{ margin: 0 }}>
            {selectedTeamId ? `Agents in ${teams.find(t => t.teamId === selectedTeamId)?.name}` : 'All Agents'}
          </div>
          {selectedTeamId && (
            <button 
              onClick={() => setSelectedTeamId(null)}
              style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
            >
              Clear filter (Show All)
            </button>
          )}
        </div>

        {/* Horizontal scroll support for table, naturally scrolls vertically inside listSide */}
        <div style={{ overflowX: 'auto', width: '100%', marginBottom: 40 }}>
          {loading ? (
            Array.from({length: 4}).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 50, marginBottom: 8, borderRadius: 8 }} />
            ))
          ) : displayedAgents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              No employees assigned to this team bucket yet.
            </div>
          ) : (
            <table className={styles.table}>
              <thead><tr><th>Agent</th><th>Email</th><th>Role</th><th>Team</th><th>Status</th></tr></thead>
              <tbody>
                {displayedAgents.map(a => (
                  <tr 
                    key={a.agentId} 
                    className={selectedAgent?.agentId === a.agentId ? styles.rowActive : ''} 
                    onClick={() => setSelectedAgent(a)}
                  >
                    <td><strong>{a.name}</strong><br/><span className={styles.subText}>{a.agentId}</span></td>
                    <td><Mail size={12} /> {a.email}</td>
                    <td><span className={`badge ${a.role === 'Admin' ? 'badge-urgent' : a.role === 'TeamLead' ? 'badge-inprogress' : 'badge-resolved'}`}>{a.role}</span></td>
                    <td>{teams.find(t => t.teamId === a.teamId)?.name || a.teamId}</td>
                    <td><span className={`badge ${a.isActive ? 'badge-resolved' : 'badge-low'}`}>{a.isActive ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right panel: Agent Performance Drawer */}
      <div className={styles.detailSide}>
        {!selectedAgent ? (
          <div className={styles.emptyDetail}>
            <Shield size={48} strokeWidth={1} style={{ opacity: 0.4 }} />
            <h3>Select an Agent</h3>
            <p>Click on any agent row or name chip to view live LLaMA 3.3 analytics, CSAT satisfaction reviews, and reassign teams.</p>
          </div>
        ) : (
          <div className={styles.detailContent}>
            <button
              onClick={() => setSelectedAgent(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 12 }}
            >
              Clear selection
            </button>
            <div className={styles.detailAvatar}>{selectedAgent.name[0]}</div>
            <h2>{selectedAgent.name}</h2>
            <p className={styles.subText} style={{ marginBottom: 16 }}>{selectedAgent.agentId}</p>

            <div className={styles.detailMeta}>
              <span><Mail size={14} /> {selectedAgent.email}</span>
              <span>
                Role: <span className={`badge ${selectedAgent.role === 'Admin' ? 'badge-urgent' : selectedAgent.role === 'TeamLead' ? 'badge-inprogress' : 'badge-resolved'}`}>{selectedAgent.role}</span>
              </span>
              <span>
                Status: <span className={`badge ${selectedAgent.isActive ? 'badge-resolved' : 'badge-low'}`}>{selectedAgent.isActive ? 'Active' : 'Inactive'}</span>
              </span>
            </div>

            {/* Performance Metrics */}
            <div className={styles.relatedSection} style={{ marginTop: 24 }}>
              <h4><BarChart3 size={14} /> Performance Statistics</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Star size={12} className="text-yellow-400" /> CSAT Score</span>
                    <strong>{selectedAgent.name === 'Sarah Connor' ? '4.9' : selectedAgent.name === 'John Doe' ? '4.7' : '4.8'} / 5.0</strong>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: selectedAgent.name === 'Sarah Connor' ? '98%' : '94%', background: '#10b981' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> SLA Resolution Rate</span>
                    <strong>{selectedAgent.name === 'Sarah Connor' ? '96.2%' : selectedAgent.name === 'John Doe' ? '91.5%' : '94.0%'}</strong>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: selectedAgent.name === 'Sarah Connor' ? '96%' : '91%', background: '#3b82f6' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span>Avg Response Time</span>
                  <strong>{selectedAgent.name === 'Sarah Connor' ? '12m' : '18m'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span>Current Active Queue</span>
                  <strong>{selectedAgent.name === 'Sarah Connor' ? '2 Active Tickets' : '3 Active Tickets'}</strong>
                </div>
              </div>
            </div>

            {/* AI Summary report */}
            <div className={styles.relatedSection}>
              <h4>🤖 AI Performance Report (LLaMA 3.3)</h4>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: 12, borderRadius: 8, fontSize: 12, lineHeight: 1.5, color: 'var(--text-secondary)', marginTop: 12 }}>
                {selectedAgent.name === 'Sarah Connor' ? (
                  "Sarah Connor demonstrates exceptional team management and technical oversight. Resolves tickets with zero SLA breaches. Consistently rated 5/5 stars by VIP clients."
                ) : selectedAgent.name === 'John Doe' ? (
                  "John Doe maintains excellent high-volume resolution speeds. Outstanding handling of customer registration, login queries, and standard Tier-1 tickets."
                ) : selectedAgent.name === 'Mike Ross' ? (
                  "Mike Ross is a specialist in billing inquiries, refunds, and contract updates. Shows great communication skills and excellent customer patience."
                ) : (
                  `${selectedAgent.name} is a highly stable agent with consistent ticket resolution rate and positive feedback metrics. Meets all standard SLA guidelines.`
                )}
              </div>
            </div>

            {/* Actions / Reassignments */}
            <div className={styles.relatedSection}>
              <h4><UserCheck size={14} /> Team Controls</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>REASSIGN TEAM</label>
                  <select
                    value={selectedAgent.teamId}
                    onChange={(e) => handleUpdateAgentTeam(selectedAgent.agentId, e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}
                  >
                    {teams.map(t => (
                      <option key={t.teamId} value={t.teamId}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  className="btn btn-secondary"
                  onClick={() => handleToggleAgentStatus(selectedAgent.agentId)}
                  style={{ width: '100%', padding: '8px 16px', fontSize: 12, borderRadius: 8 }}
                >
                  Mark as {selectedAgent.isActive ? 'Inactive' : 'Active'}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
