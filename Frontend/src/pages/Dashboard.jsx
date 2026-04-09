// Frontend/src/pages/Dashboard.jsx
import { Users, Truck, IndianRupee, AlertTriangle, Clock, TrendingUp, PackageCheck, Car, Users as UsersIcon } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useApp } from '../context/AppContext'
import { monthlyData, itemBreakdown } from '../data/mockData'
import { fmtDate, fmtCurrency, donorStatusColor } from '../utils/helpers'

const PIE_COLORS = ['#E8521A', '#1B5E35', '#F5B942', '#3B82F6', '#8B5CF6', '#EC4899']

export default function Dashboard({ onNav }) {
  const { donors, pickups, dashboardStats: stats } = useApp()

  const overdue    = donors.filter(d => d.nextPickup && new Date(d.nextPickup) < new Date() && d.status === 'Active')
  const upcoming   = pickups.filter(p => p.status === 'Pending').slice(0, 5)
  const pendingPay = pickups.filter(p => p.paymentStatus !== 'Paid' && p.status === 'Completed')

  return (
    <div className="page-body">
      {/* Stat Grid */}
      <div className="stat-grid">
        <div className="stat-card orange">
          <div className="stat-icon"><Users size={20} /></div>
          <div className="stat-value">{stats.activeDonors}</div>
          <div className="stat-label">Active Donors</div>
          <div className="stat-change up">of {stats.totalDonors} total</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><Truck size={20} /></div>
          <div className="stat-value">{stats.totalPickupsThisMonth}</div>
          <div className="stat-label">Pickups Completed</div>
          <div className="stat-change up">↑ 4 from last month</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-icon"><IndianRupee size={20} /></div>
          <div className="stat-value">₹{stats.totalRSTValue.toLocaleString('en-IN')}</div>
          <div className="stat-label">RST Value (Kabadiwala → FP)</div>
          <div className="stat-change up">↑ ₹1,200 this month</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon"><AlertTriangle size={20} /></div>
          <div className="stat-value">{overdue.length}</div>
          <div className="stat-label">Overdue Pickups</div>
          <div className="stat-change down">Needs attention</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon"><Clock size={20} /></div>
          <div className="stat-value">{stats.upcomingPickups}</div>
          <div className="stat-label">Upcoming Pickups</div>
          <div className="stat-change up">Next 7 days</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon"><PackageCheck size={20} /></div>
          <div className="stat-value">{stats.pendingPayments}</div>
          <div className="stat-label">Pending Kabadiwala Payments</div>
          <div className="stat-change down">Awaiting clearance</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon"><UsersIcon size={20} /></div>
          <div className="stat-value">{stats.drivePickups ?? 0}</div>
          <div className="stat-label">Drive Pickups</div>
          <div className="stat-change up">Community events</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><Car size={20} /></div>
          <div className="stat-value">{stats.individualPickups ?? 0}</div>
          <div className="stat-label">Individual Pickups</div>
          <div className="stat-change up">Household visits</div>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdue.length > 0 && (
        <div className="alert-strip alert-warning" style={{ marginBottom: 20 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>{overdue.length} donor{overdue.length > 1 ? 's' : ''} overdue for pickup:</strong>{' '}
            {overdue.map(d => d.name).join(', ')}.{' '}
            <button onClick={() => onNav('pickups')} style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', color: 'inherit', fontWeight: 600 }}>
              Schedule now →
            </button>
          </div>
        </div>
      )}

      <div className="two-col">
        {/* Monthly RST Value Chart */}
        <div className="card page-section">
          <div className="card-header">
            <TrendingUp size={18} color="var(--primary)" />
            <div className="card-title">Monthly RST Value (₹)</div>
          </div>
          <div className="card-body" style={{ paddingTop: 10 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barSize={28}>
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}k`} />
                <Tooltip formatter={v => [`₹${v}`, 'RST Value']} contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }} />
                <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RST Item Breakdown */}
        <div className="card page-section">
          <div className="card-header">
            <PackageCheck size={18} color="var(--secondary)" />
            <div className="card-title">RST Item Breakdown</div>
          </div>
          <div className="card-body" style={{ paddingTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={itemBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                    {itemBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {itemBreakdown.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)' }}>{item.name}</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{item.value}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="two-col">
        {/* Upcoming Pickups */}
        <div className="card">
          <div className="card-header">
            <Clock size={18} color="var(--info)" />
            <div className="card-title">Upcoming Pickups</div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNav('pickups')}>View All</button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {upcoming.length === 0 ? (
              <div className="empty-state" style={{ padding: 30 }}><p>No upcoming pickups scheduled</p></div>
            ) : upcoming.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Truck size={16} color="var(--info)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }} className="truncate">{p.donorName}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{p.society} · {p.pickupMode || 'Individual'}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{fmtDate(p.date)}</div>
                  <span className="badge badge-primary" style={{ fontSize: 10 }}>{p.type || 'RST'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Kabadiwala Payments */}
        <div className="card">
          <div className="card-header">
            <IndianRupee size={18} color="var(--warning)" />
            <div className="card-title">Pending Kabadiwala Payments</div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNav('kabadiwala')}>View All</button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {pendingPay.length === 0 ? (
              <div className="empty-state" style={{ padding: 30 }}><p>All payments cleared! 🎉</p></div>
            ) : pendingPay.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }} className="truncate">{p.donorName}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{fmtDate(p.date)} · {p.kabadiwala || 'No kabadiwala'}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 13.5 }}>{fmtCurrency(p.totalValue - p.amountPaid)}</div>
                  <span className="badge badge-warning" style={{ fontSize: 10 }}>Due to FP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Donor Overview Table */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <Users size={18} color="var(--primary)" />
          <div className="card-title">Donor Overview</div>
          <button className="btn btn-ghost btn-sm" onClick={() => onNav('donors')}>Manage Donors</button>
        </div>
        <div className="table-wrap" style={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Donor</th>
                <th>Society</th>
                <th>Status</th>
                <th>Last Pickup</th>
                <th>Next Pickup</th>
                <th>RST Donated</th>
                <th>SKS Donated</th>
              </tr>
            </thead>
            <tbody>
              {donors.filter(d => d.status !== 'Lost').map(d => (
                <tr key={d.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{d.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{d.mobile}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 12.5 }}>{d.society}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.city}</div>
                  </td>
                  <td><span className={`badge ${donorStatusColor(d.status)}`}>{d.status}</span></td>
                  <td style={{ fontSize: 12.5 }}>{fmtDate(d.lastPickup)}</td>
                  <td style={{ fontSize: 12.5, fontWeight: d.nextPickup && new Date(d.nextPickup) < new Date() ? 700 : 400, color: d.nextPickup && new Date(d.nextPickup) < new Date() ? 'var(--danger)' : 'inherit' }}>
                    {fmtDate(d.nextPickup)}
                  </td>
                  <td style={{ fontWeight: 600 }}>{fmtCurrency(d.totalRST)}</td>
                  <td style={{ fontSize: 12.5 }}>{d.totalSKS} pickups</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}