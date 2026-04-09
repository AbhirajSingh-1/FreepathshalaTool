import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'
import { Download } from 'lucide-react'
import { donors, pickups, kabadiwalas, monthlyData, itemBreakdown } from '../data/mockData'
import { fmtCurrency, exportToExcel } from '../utils/helpers'

const PIE_COLORS = ['#E8521A','#1B5E35','#F5B942','#3B82F6','#8B5CF6']

const kabStats = kabadiwalas.map(k => ({
  name: k.name,
  pickups: k.totalPickups,
  value: k.totalValue,
}))

const donorStatusData = [
  { name: 'Active',    value: donors.filter(d => d.status==='Active').length },
  { name: 'Postponed', value: donors.filter(d => d.status==='Postponed').length },
  { name: 'Lost',      value: donors.filter(d => d.status==='Lost').length },
]

const sksData = [
  { item:'Kids Clothes', count:12 },
  { item:'Adult Clothes', count:9 },
  { item:'Toys', count:7 },
  { item:'Shoes', count:5 },
  { item:'Utensils', count:4 },
  { item:'Stationery', count:3 },
  { item:'Furniture', count:2 },
]

export default function Reports() {
  const totalRST   = pickups.reduce((s,p) => s + (p.totalValue||0), 0)
  const totalPaid  = pickups.reduce((s,p) => s + (p.amountPaid||0), 0)
  const totalDue   = totalRST - totalPaid
  const completedP = pickups.filter(p => p.status === 'Completed').length

  const handleExportDonors   = () => exportToExcel(donors.map(d => ({ Name:d.name, Mobile:d.mobile, Status:d.status, LastPickup:d.lastPickup, NextPickup:d.nextPickup, TotalRST:d.totalRST })), 'Donors_Report')
  const handleExportPickups  = () => exportToExcel(pickups.map(p => ({ ID:p.id, Donor:p.donorName, Date:p.date, Status:p.status, Value:p.totalValue, Paid:p.amountPaid, PayStatus:p.paymentStatus })), 'Pickups_Report')

  return (
    <div className="page-body">
      {/* KPI Row */}
      <div className="stat-grid" style={{ marginBottom:24 }}>
        <div className="stat-card orange">
          <div className="stat-icon" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>₹</div>
          <div className="stat-value">{fmtCurrency(totalRST)}</div>
          <div className="stat-label">Total RST Collected</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon" style={{ background:'var(--secondary-light)', color:'var(--secondary)' }}>₹</div>
          <div className="stat-value">{fmtCurrency(totalPaid)}</div>
          <div className="stat-label">Total Amount Received</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon" style={{ background:'var(--danger-bg)', color:'var(--danger)' }}>₹</div>
          <div className="stat-value">{fmtCurrency(totalDue)}</div>
          <div className="stat-label">Total Pending</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon" style={{ background:'var(--info-bg)', color:'var(--info)' }}>🚛</div>
          <div className="stat-value">{completedP}</div>
          <div className="stat-label">Pickups Completed</div>
        </div>
      </div>

      {/* Export Buttons */}
      <div style={{ display:'flex', gap:10, marginBottom:20 }}>
        <button className="btn btn-ghost btn-sm" onClick={handleExportDonors}><Download size={13}/> Export Donors</button>
        <button className="btn btn-ghost btn-sm" onClick={handleExportPickups}><Download size={13}/> Export Pickups</button>
      </div>

      <div className="two-col" style={{ marginBottom:20 }}>
        {/* Monthly RST Trend */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Monthly RST Value Trend</div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData}>
                <XAxis dataKey="month" tick={{ fontSize:12, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
                <Tooltip formatter={v => [`₹${v}`, 'RST Value']} contentStyle={{ borderRadius:8, border:'1px solid var(--border)', fontSize:12 }} />
                <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} dot={{ fill:'var(--primary)', r:4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donor Status Pie */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Donor Status Distribution</div>
          </div>
          <div className="card-body" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={donorStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={3}>
                  {donorStatusData.map((_, i) => <Cell key={i} fill={['var(--secondary)','var(--warning)','var(--danger)'][i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize:12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="two-col">
        {/* Kabadiwala Summary */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Kabadiwala-wise Summary</div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={kabStats} layout="vertical" barSize={20}>
                <XAxis type="number" tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize:12, fill:'var(--text-secondary)' }} axisLine={false} tickLine={false} width={110} />
                <Tooltip formatter={v => [`₹${v}`, 'Value']} contentStyle={{ borderRadius:8, fontSize:12 }} />
                <Bar dataKey="value" fill="var(--secondary)" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SKS Item Tracking */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">SKS Item Collection</div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sksData} layout="vertical" barSize={18}>
                <XAxis type="number" tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="item" tick={{ fontSize:12, fill:'var(--text-secondary)' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                <Bar dataKey="count" fill="var(--accent)" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pending Payments Table */}
      <div className="card" style={{ marginTop:20 }}>
        <div className="card-header">
          <div className="card-title">Pending Payment Details</div>
        </div>
        <div className="table-wrap" style={{ border:'none', boxShadow:'none', borderRadius:0 }}>
          <table>
            <thead>
              <tr>
                <th>Donor</th>
                <th>Pickup Date</th>
                <th>Total Value</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pickups.filter(p => p.paymentStatus !== 'Paid').map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight:600 }}>{p.donorName}</td>
                  <td style={{ fontSize:12.5 }}>{p.date}</td>
                  <td style={{ fontWeight:600 }}>{fmtCurrency(p.totalValue)}</td>
                  <td style={{ color:'var(--success)', fontWeight:600 }}>{fmtCurrency(p.amountPaid)}</td>
                  <td style={{ color:'var(--danger)', fontWeight:700 }}>{fmtCurrency(p.totalValue - p.amountPaid)}</td>
                  <td><span className={`badge ${p.paymentStatus === 'Not Paid' ? 'badge-danger' : 'badge-warning'}`}>{p.paymentStatus}</span></td>
                </tr>
              ))}
              {pickups.filter(p => p.paymentStatus !== 'Paid').length === 0 && (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:24, color:'var(--success)', fontWeight:600 }}>All payments cleared! 🎉</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}