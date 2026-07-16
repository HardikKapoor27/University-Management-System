import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { studentAPI, facultyAPI, courseAPI, deptAPI, announcementAPI, resultAPI, enrollAPI, feeAPI } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from 'recharts'
import { Users, GraduationCap, BookOpen, Building2, ClipboardList, FileText, Award, TrendingUp, Bell, ChevronRight, Wallet, CheckCircle2, FileWarning } from 'lucide-react'
import { formatDateTime, pctColor } from '../utils/helpers'
import { Loader, SectionCard, StatCard } from '../components/ui/index'
import Topbar from '../components/layout/Topbar'
import { Link } from 'react-router-dom'

const COLORS = ['#7c6af7','#22d3c8','#f59e0b','#f43f5e','#22c55e','#3b82f6']

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--tt-bg)', border:'1px solid var(--tt-border)',
      borderRadius:8, padding:'8px 12px', color:'var(--tt-text)', fontSize:12, boxShadow:'var(--shadow)' }}>
      {label && <div style={{ fontWeight:600, marginBottom:4 }}>{label}</div>}
      {payload.map((p,i) => (
        <div key={i} style={{ color: p.color || 'var(--tt-text)' }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  )
}

/* ── Admin Dashboard ──────────────────────────────────────── */
function AdminDashboard() {
  const [stats, setStats] = useState({})
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      studentAPI.getAll({ page:0, size:1 }),
      facultyAPI.getAll({ page:0, size:1 }),
      courseAPI.getAll({ page:0, size:1 }),
      deptAPI.getAll(),
      announcementAPI.getMine(),
    ]).then(([s, f, c, d, a]) => {
      setStats({
        students: s.value?.data?.totalElements || 0,
        faculty:  f.value?.data?.totalElements || 0,
        courses:  c.value?.data?.totalElements || 0,
        depts:    d.value?.data?.length || 0,
      })
      setAnnouncements(a.value?.data?.slice(0,5) || [])
      setLoading(false)
    })
  }, [])

  const barData = [
    {sem:'Sem 1',students:45},{sem:'Sem 2',students:52},
    {sem:'Sem 3',students:38},{sem:'Sem 4',students:61},
    {sem:'Sem 5',students:29},{sem:'Sem 6',students:44},
    {sem:'Sem 7',students:33},{sem:'Sem 8',students:27},
  ]
  const pieData = [
    {name:'CS', value:42},{name:'ME', value:28},
    {name:'EC', value:18},{name:'Civil', value:12},
  ]

  if (loading) return <Loader full />
  return (
    <>
      <div className="stat-grid">
        <StatCard label="Total Students"  value={stats.students} icon={GraduationCap} color="#7c6af7" trend="12%" trendUp />
        <StatCard label="Faculty Members" value={stats.faculty}  icon={Users}         color="#22d3c8" />
        <StatCard label="Active Courses"  value={stats.courses}  icon={BookOpen}      color="#f59e0b" trend="3"  trendUp />
        <StatCard label="Departments"     value={stats.depts}    icon={Building2}     color="#22c55e" />
      </div>

      <div className="charts-row">
        <SectionCard title="Students per Semester"
          action={<Link to="/students" className="btn btn-ghost btn-sm">View all <ChevronRight size={12}/></Link>}>
          <div style={{ height:220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barSize={26} margin={{left:-15, right:8}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="sem" tick={{fill:'var(--text-3)',fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:'var(--text-3)',fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTip/>}/>
                <Bar dataKey="students" fill="var(--accent)" radius={[5,5,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="By Department">
          <div style={{ height:180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={76} paddingAngle={3} dataKey="value">
                  {pieData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>
                <Tooltip content={<ChartTip/>}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'6px 14px',marginTop:10}}>
            {pieData.map((d,i) => (
              <div key={d.name} style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'var(--text-2)'}}>
                <div style={{width:8,height:8,borderRadius:2,background:COLORS[i],flexShrink:0}}/>
                {d.name}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Announcements"
        action={<Link to="/announcements" className="btn btn-ghost btn-sm">Manage <ChevronRight size={12}/></Link>}>
        {announcements.length === 0
          ? <p style={{color:'var(--text-3)',fontSize:13}}>No announcements posted yet.</p>
          : <div style={{display:'flex',flexDirection:'column'}}>
              {announcements.map((a,i) => (
                <div key={a.id} style={{display:'flex',gap:14,padding:'12px 0',
                  borderBottom: i<announcements.length-1 ? '1px solid var(--border)' : 'none'}}>
                  <div style={{width:3,borderRadius:3,flexShrink:0,alignSelf:'stretch',
                    background: a.priority==='URGENT'?'var(--danger)':a.priority==='HIGH'?'var(--warning)':'var(--accent)'}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:13,marginBottom:3}}>{a.title}</div>
                    <div style={{fontSize:12,color:'var(--text-2)',marginBottom:5}} className="truncate">{a.message}</div>
                    <div style={{fontSize:11,color:'var(--text-3)'}}>{formatDateTime(a.createdAt)} · {a.postedBy}</div>
                  </div>
                  <span className={`badge ${a.priority==='URGENT'?'badge-danger':a.priority==='HIGH'?'badge-warning':'badge-accent'}`}>{a.priority}</span>
                </div>
              ))}
            </div>
        }
      </SectionCard>
    </>
  )
}

/* ── Faculty Dashboard ──────────────────────────────────────── */
function FacultyDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({courses:0})
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      courseAPI.getAll({page:0,size:100}),
      announcementAPI.getMine(),
    ]).then(([c, a]) => {
      const all = c.value?.data?.content || []
      const mine = user?.profileId ? all.filter(x => x.faculty?.id === user.profileId) : all
      setStats({ courses: mine.length })
      setAnnouncements(a.value?.data?.slice(0,5) || [])
      setLoading(false)
    })
  }, [user])

  if (loading) return <Loader full />
  return (
    <>
      <div className="stat-grid">
        <StatCard label="My Courses"  value={stats.courses} icon={BookOpen} color="var(--accent)" />
        <StatCard label="Role"        value="Faculty"        icon={Users}    color="var(--teal)" />
        <StatCard label="Attendance"  value={user?.isMentor ? 'Can Mark' : 'View Only'} icon={ClipboardList} color={user?.isMentor ? 'var(--success)' : 'var(--warning)'} />
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr',gap:18}}>
        <SectionCard title="Quick Actions">
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12}}>
            {[
              {label:'My Courses',   to:'/courses',     icon:BookOpen,      color:'var(--accent)'},
              {label:'Mark Attendance',to:'/attendance',icon:ClipboardList, color:'var(--teal)'},
              {label:'Schedule Exam', to:'/exams',      icon:FileText,      color:'var(--warning)'},
              {label:'Enter Results', to:'/results',    icon:Award,         color:'var(--success)'},
            ].map(({label,to,icon:Icon,color}) => (
              <Link key={to} to={to} style={{textDecoration:'none'}}>
                <div style={{background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:12,
                  padding:'16px',cursor:'pointer',transition:'all 0.15s',display:'flex',flexDirection:'column',gap:10}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=color;e.currentTarget.style.background=`${color}10`}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--bg-elevated)'}}>
                  <div style={{width:36,height:36,borderRadius:9,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <Icon size={17} style={{color}}/>
                  </div>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--text-1)'}}>{label}</div>
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Recent Notices">
          {announcements.length === 0
            ? <p style={{color:'var(--text-3)',fontSize:13}}>No notices.</p>
            : announcements.map((a,i)=>(
              <div key={a.id} style={{display:'flex',gap:12,padding:'11px 0',
                borderBottom:i<announcements.length-1?'1px solid var(--border)':'none'}}>
                <div style={{width:3,borderRadius:3,flexShrink:0,alignSelf:'stretch',
                  background:a.priority==='URGENT'?'var(--danger)':a.priority==='HIGH'?'var(--warning)':'var(--accent)'}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{a.title}</div>
                  <div style={{fontSize:12,color:'var(--text-2)'}} className="truncate">{a.message}</div>
                </div>
              </div>
            ))
          }
        </SectionCard>
      </div>
    </>
  )
}

/* ── Student Dashboard ──────────────────────────────────────── */
function StudentDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [results, setResults] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = user?.profileId
    Promise.allSettled([
      id ? studentAPI.getById(id) : Promise.resolve(null),
      id ? enrollAPI.getByStudent(id) : Promise.resolve({data:[]}),
      id ? resultAPI.getByStudent(id) : Promise.resolve({data:[]}),
      announcementAPI.getMine(),
    ]).then(([p,e,r,a]) => {
      setProfile(p.value?.data || null)
      setEnrollments(e.value?.data || [])
      setResults(r.value?.data || [])
      setAnnouncements(a.value?.data?.slice(0,4) || [])
      setLoading(false)
    })
  }, [user])

  if (loading) return <Loader full />

  const active = enrollments.filter(e => e.status==='ENROLLED')
  const avgAtt = active.length ? (active.reduce((s,e)=>s+(e.attendancePercentage||0),0)/active.length).toFixed(1) : 0
  const passed = results.filter(r=>r.isPassed).length

  const attData = active.slice(0,6).map(e => ({
    name: e.course?.courseCode || '?',
    attendance: parseFloat((e.attendancePercentage||0).toFixed(1))
  }))

  const gradeMap = {}
  results.forEach(r => { if (r.grade) gradeMap[r.grade] = (gradeMap[r.grade]||0)+1 })
  const gradeData = Object.entries(gradeMap).map(([g,v]) => ({name:`Grade ${g}`,value:v}))

  return (
    <>
      {/* Profile banner */}
      {profile && (
        <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,
          padding:'20px 24px',marginBottom:24,display:'flex',alignItems:'center',gap:18,
          backgroundImage:'linear-gradient(135deg,var(--accent-soft) 0%,transparent 60%)'}}>
          <div className="avatar avatar-lg">{profile.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:18,fontWeight:800,letterSpacing:'-0.3px',marginBottom:4}}>{profile.name}</div>
            <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
              {[profile.rollNumber,profile.department?.name,`Semester ${profile.semester}`].filter(Boolean).map(t=>(
                <span key={t} className="chip">{t}</span>
              ))}
            </div>
          </div>
          <span className="badge badge-success" style={{fontSize:12}}>{profile.status}</span>
        </div>
      )}

      <div className="stat-grid">
        <StatCard label="Enrolled Courses"  value={active.length}    icon={BookOpen}      color="var(--accent)" />
        <StatCard label="Avg Attendance"    value={`${avgAtt}%`}     icon={ClipboardList} color={parseFloat(avgAtt)>=75?'var(--success)':parseFloat(avgAtt)>=60?'var(--warning)':'var(--danger)'} />
        <StatCard label="Exams Passed"      value={passed}           icon={Award}         color="var(--success)" />
        <StatCard label="Total Results"     value={results.length}   icon={FileText}      color="var(--teal)" />
      </div>

      <div className="charts-row" style={{marginBottom:20}}>
        {attData.length > 0 && (
          <SectionCard title="Attendance by Course">
            <div style={{height:210}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attData} barSize={28} margin={{left:-15,right:8}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                  <XAxis dataKey="name" tick={{fill:'var(--text-3)',fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis domain={[0,100]} tick={{fill:'var(--text-3)',fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Bar dataKey="attendance" radius={[5,5,0,0]}>
                    {attData.map((d,i) => (
                      <Cell key={i} fill={d.attendance>=75?'var(--success)':d.attendance>=60?'var(--warning)':'var(--danger)'}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        )}
        {gradeData.length > 0 && (
          <SectionCard title="Grade Distribution">
            <div style={{height:180}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={gradeData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                    {gradeData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip content={<ChartTip/>}/>
                  <Legend formatter={v=><span style={{color:'var(--text-2)',fontSize:11}}>{v}</span>} iconSize={8}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        )}
      </div>

      {active.length > 0 && (
        <SectionCard title="My Enrolled Courses" style={{marginBottom:20}}
          action={<Link to="/courses" className="btn btn-ghost btn-sm">View all <ChevronRight size={12}/></Link>}>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {active.map(e => {
              const pct = e.attendancePercentage || 0
              return (
                <div key={e.id} style={{display:'flex',alignItems:'center',gap:14,
                  padding:'12px 14px',background:'var(--bg-elevated)',borderRadius:10}}>
                  <div style={{width:38,height:38,borderRadius:9,background:'var(--accent-soft)',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontFamily:'var(--font-mono)',fontSize:10,color:'var(--accent)',fontWeight:700,flexShrink:0}}>
                    {(e.course?.courseCode||'??').slice(-3)}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600}} className="truncate">{e.course?.title||'—'}</div>
                    <div style={{fontSize:11,color:'var(--text-3)',marginTop:1}}>{e.course?.credits} cr · Sem {e.course?.semester}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:pctColor(pct)}}>{pct.toFixed(0)}%</div>
                    <div className="progress-bar" style={{width:60,marginTop:4}}>
                      <div className="progress-fill" style={{width:`${Math.min(pct,100)}%`,background:pctColor(pct)}}/>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Notices" action={<Link to="/announcements" className="btn btn-ghost btn-sm">All <ChevronRight size={12}/></Link>}>
        {announcements.length === 0
          ? <p style={{color:'var(--text-3)',fontSize:13}}>No notices right now.</p>
          : announcements.map((a,i)=>(
            <div key={a.id} style={{display:'flex',gap:12,padding:'11px 0',
              borderBottom:i<announcements.length-1?'1px solid var(--border)':'none'}}>
              <div style={{width:3,borderRadius:3,flexShrink:0,alignSelf:'stretch',
                background:a.priority==='URGENT'?'var(--danger)':a.priority==='HIGH'?'var(--warning)':'var(--accent)'}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{a.title}</div>
                <div style={{fontSize:12,color:'var(--text-2)'}} className="truncate">{a.message}</div>
                <div style={{fontSize:11,color:'var(--text-3)',marginTop:3}}>{formatDateTime(a.createdAt)}</div>
              </div>
              <span className={`badge ${a.priority==='URGENT'?'badge-danger':a.priority==='HIGH'?'badge-warning':'badge-accent'}`}>{a.priority}</span>
            </div>
          ))
        }
      </SectionCard>
    </>
  )
}

/* ── Accounts Dashboard ───────────────────────────────────────── */
function AccountsDashboard() {
  const [summary, setSummary] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [reminding, setReminding] = useState(null)
  const [toast, setToast] = useState('')

  const load = () => {
    Promise.allSettled([feeAPI.duesSummary(), feeAPI.getAllInvoices()]).then(([s, i]) => {
      setSummary(s.value?.data || {})
      setInvoices(i.value?.data || [])
      setLoading(false)
    })
  }
  useEffect(() => { load() }, [])

  const quickRemind = async (inv) => {
    setReminding(inv.id)
    try {
      await feeAPI.sendReminder(inv.id)
      setToast(`Reminder sent to ${inv.student?.name}`)
      setTimeout(() => setToast(''), 3500)
    } finally {
      setReminding(null)
    }
  }

  if (loading) return <Loader full />

  const statusPie = [
    { name: 'Pending', value: summary?.pendingCount || 0 },
    { name: 'Partial', value: summary?.partialCount || 0 },
    { name: 'Paid',    value: summary?.paidCount || 0 },
  ].filter(d => d.value > 0)
  const statusColors = { Pending: '#f59e0b', Partial: '#3b82f6', Paid: '#22c55e' }

  const overdue = invoices
    .filter(i => i.status !== 'PAID')
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    .slice(0, 6)
  const recentPayments = invoices.filter(i => i.amountPaid > 0).slice(0, 6)

  return (
    <>
      {toast && <div className="alert alert-success" style={{ marginBottom: 16 }}>{toast}</div>}

      <div className="stat-grid">
        <StatCard label="Total Collected" value={`₹${(summary?.totalCollected||0).toLocaleString('en-IN')}`} icon={CheckCircle2} color="var(--success)" />
        <StatCard label="Outstanding"     value={`₹${(summary?.totalOutstanding||0).toLocaleString('en-IN')}`} icon={FileWarning} color="var(--warning)" />
        <StatCard label="Pending Invoices" value={summary?.pendingCount||0} icon={Wallet} color="var(--danger)" />
        <StatCard label="Fully Paid"      value={summary?.paidCount||0} icon={Award} color="var(--accent)" />
      </div>

      <div style={{ display: 'flex', gap: 10, margin: '16px 0 20px' }}>
        <Link to="/fees" className="btn btn-primary btn-sm"><Wallet size={14}/> Generate Invoice</Link>
        <Link to="/fees" className="btn btn-secondary btn-sm">Add Fee Structure</Link>
        <Link to="/fees" className="btn btn-ghost btn-sm">Full Fee Management <ChevronRight size={12}/></Link>
      </div>

      <div className="charts-row">
        <SectionCard title="Invoices Needing Attention"
          action={<Link to="/fees" className="btn btn-ghost btn-sm">View all <ChevronRight size={12}/></Link>}>
          {overdue.length === 0 ? (
            <p style={{color:'var(--text-3)',fontSize:13}}>Nothing outstanding — great job!</p>
          ) : (
            <div className="cc-item-list">
              {overdue.map(inv => (
                <div className="cc-item" key={inv.id}>
                  <div className="cc-item-icon"><FileWarning size={16}/></div>
                  <div className="cc-item-body">
                    <div className="cc-item-title">{inv.student?.name} · {inv.invoiceNumber}</div>
                    <div className="cc-item-meta">
                      Due {inv.dueDate || '—'} · ₹{(inv.amountDue - inv.amountPaid).toLocaleString('en-IN')} remaining
                    </div>
                  </div>
                  <span className={`badge ${inv.status==='PARTIAL'?'badge-info':'badge-warning'}`}>{inv.status}</span>
                  <button className="btn btn-ghost btn-xs" disabled={reminding===inv.id} onClick={() => quickRemind(inv)}>
                    <Bell size={12}/> {reminding===inv.id ? 'Sending…' : 'Remind'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Invoice Status Split">
          {statusPie.length === 0 ? (
            <p style={{color:'var(--text-3)',fontSize:13}}>No invoices yet.</p>
          ) : (
            <>
              <div style={{ height:180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusPie} cx="50%" cy="50%" innerRadius={48} outerRadius={76} paddingAngle={3} dataKey="value">
                      {statusPie.map((d,i) => <Cell key={i} fill={statusColors[d.name]}/>)}
                    </Pie>
                    <Tooltip content={<ChartTip/>}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'6px 14px',marginTop:10,justifyContent:'center'}}>
                {statusPie.map(d => (
                  <div key={d.name} style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'var(--text-2)'}}>
                    <div style={{width:8,height:8,borderRadius:2,background:statusColors[d.name],flexShrink:0}}/>
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Recent Payments" action={<Link to="/fees" className="btn btn-ghost btn-sm">Manage <ChevronRight size={12}/></Link>}>
        {recentPayments.length === 0 ? (
          <p style={{color:'var(--text-3)',fontSize:13}}>No payments recorded yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Invoice #</th><th>Student</th><th>Amount Due</th><th>Paid</th><th>Status</th></tr></thead>
              <tbody>
                {recentPayments.map(inv => (
                  <tr key={inv.id}>
                    <td>{inv.invoiceNumber}</td>
                    <td>{inv.student?.name}</td>
                    <td>₹{inv.amountDue.toLocaleString('en-IN')}</td>
                    <td>₹{inv.amountPaid.toLocaleString('en-IN')}</td>
                    <td><span className={`badge ${inv.status==='PAID'?'badge-success':inv.status==='PARTIAL'?'badge-info':'badge-warning'}`}>{inv.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const h = new Date().getHours()
  const greet = h<12?'Good morning':h<17?'Good afternoon':'Good evening'
  const name = user?.profileName || user?.username

  return (
    <>
      <Topbar title="Dashboard"/>
      <div className="page animate-in">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">{greet}, {name} 👋</h1>
            <p className="page-subtitle">
              {user?.role==='ADMIN' && "Here's your university overview for today"}
              {user?.role==='FACULTY' && "Here's your teaching overview"}
              {user?.role==='STUDENT' && "Here's your academic progress"}
              {user?.role==='ACCOUNTS' && "Here's the fee collection overview"}
            </p>
          </div>
        </div>
        {user?.role==='ADMIN'   && <AdminDashboard/>}
        {user?.role==='FACULTY' && <FacultyDashboard/>}
        {user?.role==='STUDENT' && <StudentDashboard/>}
        {user?.role==='ACCOUNTS' && <AccountsDashboard/>}
      </div>
    </>
  )
}
