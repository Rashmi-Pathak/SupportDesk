'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Customer, PaginationMeta } from '@/lib/types';
import { formatTimeAgo } from '@/lib/constants';
import { Search, Users, Mail, Phone, Building, Ticket, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '../pages.module.css';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page, limit: 20 };
    if (search) params.q = search;
    api.getCustomers(params).then(res => {
      if (res.success) { setCustomers(res.data); setMeta(res.meta || null); }
      setLoading(false);
    });
  }, [page, search]);

  const selectCustomer = async (c: Customer) => {
    setSelected(null); setDetailLoading(true);
    const res = await api.getCustomerById(c.customerId);
    if (res.success) setSelected(res.data);
    setDetailLoading(false);
  };

  return (
    <div className={styles.splitPage}>
      <div className={styles.listSide}>
        <div className={styles.listHeader}>
          <div className={styles.searchBar}><Search size={16} /><input placeholder="Search customers..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
        </div>
        <div className={styles.tableWrap}>
          {loading ? Array.from({length:5}).map((_,i) => <div key={i} className="skeleton" style={{height:52,marginBottom:4,borderRadius:8}} />) :
          <table className={styles.table}>
            <thead><tr><th>Customer</th><th>Company</th><th>Email</th><th>Joined</th></tr></thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.customerId} onClick={() => selectCustomer(c)} className={selected?.customerId === c.customerId ? styles.rowActive : ''}>
                  <td><strong>{c.name}</strong><br/><span className={styles.subText}>{c.customerId}</span></td>
                  <td><Building size={12} /> {c.company}</td>
                  <td>{c.email}</td>
                  <td>{formatTimeAgo(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>}
        </div>
        {meta && meta.totalPages > 1 && (
          <div className={styles.pagination}>
            <button disabled={page<=1} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={16}/></button>
            <span>{page} / {meta.totalPages}</span>
            <button disabled={page>=meta.totalPages} onClick={()=>setPage(p=>p+1)}><ChevronRight size={16}/></button>
          </div>
        )}
      </div>
      <div className={styles.detailSide}>
        {!selected && !detailLoading ? (
          <div className={styles.emptyDetail}><Users size={48} strokeWidth={1} /><p>Select a customer</p></div>
        ) : detailLoading ? (
          <div className={styles.emptyDetail}><div className="spinner" /></div>
        ) : selected && (
          <div className={styles.detailContent}>
            <div className={styles.detailAvatar}>{selected.name[0]}</div>
            <h2>{selected.name}</h2>
            <div className={styles.detailMeta}>
              <span><Mail size={14} /> {selected.email}</span>
              <span><Phone size={14} /> {selected.phone}</span>
              <span><Building size={14} /> {selected.company}</span>
            </div>
            {selected.tickets && selected.tickets.length > 0 && (
              <div className={styles.relatedSection}>
                <h4><Ticket size={14} /> Tickets ({selected.tickets.length})</h4>
                {selected.tickets.slice(0,10).map(t => (
                  <div key={t.ticketId} className={styles.relatedItem}>
                    <strong>{t.ticketId.slice(-10)}</strong>
                    <span>{t.subject}</span>
                    <span className={`badge ${t.status === 'Resolved' ? 'badge-resolved' : 'badge-pending'}`}>{t.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
