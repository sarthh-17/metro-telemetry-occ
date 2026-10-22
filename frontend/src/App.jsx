import { useCallback, useEffect, useMemo, useState } from 'react'
import './index.css'
import './App.css'

const API_URL = 'http://localhost:8080/api/rakes'

const MODULES = [
  { id: 'dashboard', icon: '📊', label: 'Overview Dashboard' },
  { id: 'occ', icon: '🎛️', label: 'Operations Control Center' },
  { id: 'fleet', icon: '🔧', label: 'Fleet & Telemetry' },
  { id: 'map', icon: '🛤️', label: 'Live Line & Route Map' },
  { id: 'safety', icon: '⚠️', label: 'Safety & Incident Desk' },
  { id: 'analytics', icon: '📈', label: 'Analytics & Fitness Reports' },
]

const STATIONS = [
  'Aluva', 'Pulinchodu', 'Companypady', 'Ambattukavu', 'Kalamassery',
  'Cochin University', 'Pathadipalam', 'Edapally', 'Changampuzha Park',
  'Palarivattom', 'JLN Stadium', 'Kaloor', 'Lissie', 'Maharajas College',
  'Ernakulam South', 'Kadavanthra', 'Elamkulam', 'Vytilla', 'Thykkoodam',
  'Pettah', 'Vadakkekotta', 'SN Junction', 'Thripunithura',
]

const EMPTY_FORM = {
  rakeNumber: '',
  totalMileage: '',
  status: 'FIT_FOR_SERVICE',
  fitnessExpiryDate: '',
}

function App() {
  const [currentModule, setCurrentModule] = useState('dashboard')
  const [rakes, setRakes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [apiError, setApiError] = useState('')
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRakeId, setSelectedRakeId] = useState(null)
  const [toasts, setToasts] = useState([])
  const [utcTime, setUtcTime] = useState('')
  const [istTime, setIstTime] = useState('')

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, message, type }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 4500)
  }, [])

  const loadRakes = useCallback(async () => {
    setApiError('')
    try {
      const response = await fetch(API_URL)
      if (!response.ok) {
        throw new Error(`Unable to load fleet data (HTTP ${response.status}).`)
      }
      const data = await response.json()
      if (!Array.isArray(data)) {
        throw new Error('The fleet API returned an unexpected response.')
      }
      setRakes(data)
      setSelectedRakeId((currentId) => (
        data.some((rake) => rake.id === currentId) ? currentId : data[0]?.id ?? null
      ))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load fleet data.'
      setApiError(message)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadRakes()
    const updateClocks = () => {
      const now = new Date()
      setUtcTime(`${now.toISOString().replace('T', ' ').slice(0, 19)} UTC`)
      setIstTime(`${now.toLocaleTimeString('en-IN', {
        hour12: false,
        timeZone: 'Asia/Kolkata',
      })} IST`)
    }
    updateClocks()
    const interval = window.setInterval(updateClocks, 1000)
    return () => window.clearInterval(interval)
  }, [loadRakes])

  const metrics = useMemo(() => {
    const fitReady = rakes.filter((rake) => rake.status === 'FIT_FOR_SERVICE').length
    const maintenance = rakes.filter((rake) => rake.status === 'MAINTENANCE').length
    const awaitingCleaning = rakes.filter((rake) => rake.status === 'AWAITING_CLEANING').length
    const mileage = rakes.reduce((total, rake) => total + Number(rake.totalMileage || 0), 0)
    return {
      total: rakes.length,
      fitReady,
      maintenance,
      awaitingCleaning,
      mileage,
      activeSafetyHolds: 0,
      onTimeIndex: '98.4%',
      headwayAvg: '±14s',
    }
  }, [rakes])

  const filteredRakes = useMemo(() => rakes.filter((rake) => {
    const matchesFilter = activeFilter === 'ALL' || rake.status === activeFilter
    const matchesSearch = `${rake.rakeNumber} ${rake.status}`.toLowerCase()
      .includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  }), [rakes, activeFilter, searchQuery])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const payload = {
      ...formData,
      rakeNumber: formData.rakeNumber.trim(),
      totalMileage: Number(formData.totalMileage),
    }
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        throw new Error(`Unable to save rake (HTTP ${response.status}).`)
      }
      await response.json()
      setFormData(EMPTY_FORM)
      await loadRakes()
      addToast(`Rake ${payload.rakeNumber} saved to the fleet database.`, 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save rake.'
      setApiError(message)
      addToast(message, 'danger')
    }
  }

  const handleDelete = async (rake) => {
    try {
      const response = await fetch(`${API_URL}/${rake.id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error(`Unable to delete ${rake.rakeNumber} (HTTP ${response.status}).`)
      }
      setApiError('')
      setRakes((current) => current.filter((item) => item.id !== rake.id))
      addToast(`${rake.rakeNumber} removed from the fleet database.`, 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete rake.'
      setApiError(message)
      addToast(message, 'danger')
    }
  }

  const handleToggleStatus = async (rake) => {
    const status = rake.status === 'FIT_FOR_SERVICE' ? 'MAINTENANCE' : 'FIT_FOR_SERVICE'
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rake, status }),
      })
      if (!response.ok) {
        throw new Error(`Unable to update ${rake.rakeNumber} (HTTP ${response.status}).`)
      }
      await response.json()
      setApiError('')
      await loadRakes()
      addToast(`${rake.rakeNumber} updated to ${status.replaceAll('_', ' ')}.`, 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update rake status.'
      setApiError(message)
      addToast(message, 'danger')
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadRakes()
  }

  const activeRake = rakes.find((rake) => rake.id === selectedRakeId) ?? null
  const pageTitle = MODULES.find((module) => module.id === currentModule)?.label

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">🚇</div>
          <div>
            <div className="brand-title">KOCHI METRO RAIL LIMITED <span>OFFICIAL PORTAL</span></div>
            <div className="brand-subtitle">METRO OPERATIONS &amp; FLEET MANAGEMENT SYSTEM</div>
          </div>
        </div>
        <div className="topbar-status">
          <span className="online-pill"><i /> SYS.ONLINE</span>
          <div className="clock"><span>{utcTime}</span><strong>{istTime}</strong></div>
          <button className="button button-muted" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? 'SYNCING…' : '↻ REFRESH DATA'}
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="sidebar-label">Navigation Modules</div>
          <nav aria-label="Main navigation">
            {MODULES.map((module) => (
              <button
                key={module.id}
                className={`nav-item ${currentModule === module.id ? 'active' : ''}`}
                onClick={() => setCurrentModule(module.id)}
              >
                <span>{module.icon}</span><span>{module.label}</span>
                {module.id === 'fleet' && metrics.maintenance > 0 && (
                  <small>{metrics.maintenance} Maint.</small>
                )}
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            <span>STATION HQ</span>
            <strong>Muttom Depot OCC</strong>
            <small>KMRL RailNet v3.4.2</small>
          </div>
        </aside>

        <main className="main-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">ROLLING STOCK TELEMETRY / OCC-HQ</div>
              <h1>{pageTitle}</h1>
            </div>
            <span className="sync-label">{isLoading ? 'CONNECTING TO FLEET API…' : 'LIVE FLEET DATA'}</span>
          </div>

          {apiError && (
            <div className="api-error" role="alert">
              <strong>Fleet API unavailable</strong>
              <span>{apiError}</span>
              <button onClick={handleRefresh}>Retry</button>
            </div>
          )}

          {currentModule === 'dashboard' && (
            <Dashboard
              metrics={metrics}
              rakes={rakes}
              onNavigate={setCurrentModule}
              isLoading={isLoading}
            />
          )}

          {currentModule === 'occ' && (
            <Operations
              metrics={metrics}
              rakes={filteredRakes}
              allRakes={rakes}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              formData={formData}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onToggle={handleToggleStatus}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          )}

          {currentModule === 'fleet' && (
            <Fleet
              rakes={rakes}
              selectedRake={activeRake}
              onSelect={setSelectedRakeId}
              onToggle={handleToggleStatus}
            />
          )}

          {currentModule === 'map' && <RouteMap rakes={rakes} />}

          {currentModule === 'safety' && (
            <Safety activeSafetyHolds={metrics.activeSafetyHolds} />
          )}

          {currentModule === 'analytics' && (
            <Analytics metrics={metrics} rakes={rakes} />
          )}
        </main>
      </div>

      <footer className="system-footer">
        <span>KOCHI METRO RAIL LIMITED © 2026 <b>|</b> LINE 1: ALUVA - THRIPUNITHURA (28.1 KM)</span>
        <span>REST API: {apiError ? 'UNAVAILABLE' : 'CONNECTED'}</span>
      </footer>

      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>{toast.message}</div>
        ))}
      </div>
    </div>
  )
}

function Dashboard({ metrics, rakes, onNavigate, isLoading }) {
  const cards = [
    ['TOTAL FLEET SIZE', `${metrics.total} Rakes`, 'Kochi Metro Rakes', 'navy'],
    ['FIT FOR SERVICE', `${metrics.fitReady} Ready`, 'Available for dispatch', 'green'],
    ['UNDER MAINTENANCE', `${metrics.maintenance} Rakes`, 'Depot / scheduled', 'amber'],
    ['AWAITING CLEANING', `${metrics.awaitingCleaning} Rakes`, 'Requires attention', 'blue'],
    ['ON-TIME INDEX', metrics.onTimeIndex, `Headway ${metrics.headwayAvg}`, 'teal'],
    ['SAFETY HOLDS', `${metrics.activeSafetyHolds} Active`, 'Safety API not connected', 'red'],
  ]
  const shortcuts = [
    ['🎛️', 'Operations Control Center', 'Fleet records, search, telemetry entry and dispatch controls.', 'occ'],
    ['🔧', 'Fleet & Maintenance', 'Inspect fleet status, fitness expiry and maintenance records.', 'fleet'],
    ['🛤️', 'Live Route Map', 'Line 1 schematic from Aluva to Thripunithura.', 'map'],
    ['⚠️', 'Safety & Incident Desk', 'Review active track holds and the safety status.', 'safety'],
  ]
  const total = Math.max(metrics.total, 1)

  return (
    <div className="content-stack">
      <section className="welcome-panel">
        <div>
          <div className="eyebrow eyebrow-light">OPERATOR DUTY SESSION <span>•</span> DISPATCHER.4</div>
          <h2>Welcome to the Operations Control Center</h2>
          <p>Kochi Metro Line 1 operations and fleet dispatch. Fleet figures below are loaded from the connected backend.</p>
        </div>
        <div className="shift-card"><span>CURRENT SHIFT PROFILE</span><strong>Chief Dispatcher</strong><small>Morning Shift (06:00 - 14:00)</small></div>
      </section>

      <section className="metric-grid">
        {cards.map(([title, value, sub, color]) => (
          <div className={`metric-card metric-${color}`} key={title}>
            <span>{title}</span><strong>{isLoading ? '—' : value}</strong><small>{sub}</small>
          </div>
        ))}
      </section>

      <section>
        <h2 className="section-title">Core Management Modules</h2>
        <div className="shortcut-grid">
          {shortcuts.map(([icon, title, description, module]) => (
            <button className="shortcut-card" key={module} onClick={() => onNavigate(module)}>
              <span className="shortcut-icon">{icon}</span>
              <strong>{title}</strong>
              <span>{description}</span>
              <b>OPEN MODULE →</b>
            </button>
          ))}
        </div>
      </section>

      <section className="panel utilization-panel">
        <div className="panel-heading">
          <div><h2>Fleet Deployment &amp; Utilization Readiness</h2><p>Live distribution from the fleet database</p></div>
          <span>FLEET STATUS</span>
        </div>
        <ReadinessBar label="Fit for Service" count={metrics.fitReady} total={total} color="green" />
        <ReadinessBar label="Maintenance" count={metrics.maintenance} total={total} color="amber" />
        <ReadinessBar label="Awaiting Cleaning" count={metrics.awaitingCleaning} total={total} color="blue" />
        <div className="activity-summary">
          <span>Recorded fleet mileage <strong>{metrics.mileage.toLocaleString()} km</strong></span>
          <span>Fleet records <strong>{metrics.total}</strong></span>
          <span>Safety holds <strong>{metrics.activeSafetyHolds} active</strong></span>
        </div>
        <div className="panel-heading recent-heading"><div><h2>Recent Fleet Records</h2><p>Latest records returned by the API</p></div></div>
        {rakes.length === 0
          ? <p className="empty-state">No fleet records are available.</p>
          : <RakeTable rakes={rakes.slice(0, 5)} compact />}
      </section>
    </div>
  )
}

function ReadinessBar({ label, count, total, color }) {
  const percentage = Math.round((count / total) * 100)
  return (
    <div className="readiness-row">
      <div><span>{label} ({count})</span><strong>{percentage}%</strong></div>
      <div className="progress-track"><i className={`progress-${color}`} style={{ width: `${percentage}%` }} /></div>
    </div>
  )
}

function Operations({
  metrics, rakes, allRakes, activeFilter, setActiveFilter, searchQuery,
  setSearchQuery, formData, onChange, onSubmit, onToggle, onDelete, isLoading,
}) {
  const filters = [
    ['ALL', 'All'],
    ['FIT_FOR_SERVICE', 'Fit For Service'],
    ['MAINTENANCE', 'Maintenance'],
    ['AWAITING_CLEANING', 'Awaiting Cleaning'],
  ]

  return (
    <div className="content-stack">
      <section className="occ-grid">
        <aside className="panel dispatch-panel">
          <h2>OCC Dispatch Controls</h2>
          <button className="button button-amber" disabled title="No dispatch endpoint is configured">🚂 DISPATCH EXTRA</button>
          <button className="button button-danger" disabled title="No emergency-control endpoint is configured">🚨 ALL STOP PROTOCOL</button>
          <p className="feature-unavailable">Dispatch and emergency controls are disabled because the current backend does not expose these operations.</p>
          <div className="api-note"><strong>Backend status</strong><span>{metrics.total} fleet records loaded</span></div>
          <div className="api-note"><strong>Safety status</strong><span>Not connected to the fleet API</span></div>
          <div className="panel-divider" />
          <h2>Submit New Telemetry Data</h2>
          <form onSubmit={onSubmit} className="telemetry-form">
            <label>Rake number
              <input name="rakeNumber" value={formData.rakeNumber} onChange={onChange} required placeholder="e.g. R-102" />
            </label>
            <label>Mileage (km)
              <input name="totalMileage" type="number" min="0" value={formData.totalMileage} onChange={onChange} required placeholder="e.g. 92150" />
            </label>
            <label>Status
              <select name="status" value={formData.status} onChange={onChange}>
                <option value="FIT_FOR_SERVICE">Fit for service</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="AWAITING_CLEANING">Awaiting cleaning</option>
              </select>
            </label>
            <label>Fitness expiry date
              <input name="fitnessExpiryDate" type="date" value={formData.fitnessExpiryDate} onChange={onChange} required />
            </label>
            <button className="button button-primary" type="submit">+ SAVE FLEET RECORD</button>
          </form>
        </aside>

        <section className="panel fleet-list-panel">
          <div className="panel-heading">
            <div><h2>Rolling Stock Fleet</h2><p>Manage backend records and telemetry details</p></div>
            <span>{allRakes.length} RECORDS</span>
          </div>
          <div className="table-controls">
            <div className="filter-list">
              {filters.map(([value, label]) => (
                <button key={value} className={activeFilter === value ? 'selected' : ''} onClick={() => setActiveFilter(value)}>{label}</button>
              ))}
            </div>
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search rake…" aria-label="Search rakes" />
          </div>
          {isLoading
            ? <p className="empty-state">Loading fleet records…</p>
            : rakes.length === 0
              ? <p className="empty-state">No rakes match this filter or search.</p>
              : <RakeTable rakes={rakes} onToggle={onToggle} onDelete={onDelete} />}
        </section>
      </section>
    </div>
  )
}

function RakeTable({ rakes, onToggle, onDelete, compact = false }) {
  return (
    <div className="table-scroll">
      <table className="rake-table">
        <thead><tr>
          <th>Rake ID</th><th>Status</th><th>Total Mileage</th><th>Fitness Expiry</th>
          {!compact && <th className="right-align">Actions</th>}
        </tr></thead>
        <tbody>
          {rakes.map((rake) => (
            <tr key={rake.id}>
              <td><strong>{rake.rakeNumber}</strong><small>DATABASE ID: {rake.id}</small></td>
              <td><StatusBadge status={rake.status} /></td>
              <td>{Number(rake.totalMileage || 0).toLocaleString()} km</td>
              <td>{rake.fitnessExpiryDate || '—'}</td>
              {!compact && (
                <td className="right-align action-cell">
                  <button onClick={() => onToggle(rake)}>TOGGLE STATUS</button>
                  <button className="delete-action" onClick={() => onDelete(rake)}>DELETE</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ status }) {
  const label = status ? status.replaceAll('_', ' ') : 'UNKNOWN'
  const color = status === 'FIT_FOR_SERVICE' ? 'status-green'
    : status === 'MAINTENANCE' ? 'status-amber' : 'status-blue'
  return <span className={`status-badge ${color}`}>{label}</span>
}

function Fleet({ rakes, selectedRake, onSelect, onToggle }) {
  return (
    <div className="content-stack">
      <section className="panel">
        <div className="panel-heading">
          <div><h2>Fleet Maintenance &amp; Telemetry Inspector</h2><p>Choose a backend record to view its maintenance details</p></div>
          <span>MUTTOM MAINTENANCE DEPOT</span>
        </div>
        {rakes.length === 0 ? <p className="empty-state">No fleet records are available.</p> : (
          <>
            <div className="rake-picker">
              {rakes.map((rake) => (
                <button key={rake.id} className={selectedRake?.id === rake.id ? 'chosen' : ''} onClick={() => onSelect(rake.id)}>
                  <strong>{rake.rakeNumber}</strong><small>{rake.status.replaceAll('_', ' ')}</small>
                </button>
              ))}
            </div>
            {selectedRake && (
              <div className="detail-grid">
                <div className="panel detail-panel">
                  <div className="panel-heading">
                    <div><span className="eyebrow">FLEET RECORD</span><h2>{selectedRake.rakeNumber} Diagnostics</h2></div>
                    <StatusBadge status={selectedRake.status} />
                  </div>
                  <div className="detail-metrics">
                    <DetailMetric label="Total Mileage" value={`${Number(selectedRake.totalMileage || 0).toLocaleString()} km`} />
                    <DetailMetric label="Fitness Expiry" value={selectedRake.fitnessExpiryDate || 'Not recorded'} />
                    <DetailMetric label="Database ID" value={selectedRake.id} />
                    <DetailMetric label="Current Status" value={selectedRake.status.replaceAll('_', ' ')} />
                  </div>
                  <p className="api-note">The backend model stores rake number, mileage, status and fitness expiry. Additional sensor values are not provided by the current API.</p>
                </div>
                <div className="panel detail-panel">
                  <h2>Maintenance Job Card</h2>
                  <p>Use the status control to switch this rake between fit for service and maintenance.</p>
                  <button className="button button-primary" onClick={() => onToggle(selectedRake)}>TOGGLE DEPOT STATUS</button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

function DetailMetric({ label, value }) {
  return <div className="detail-metric"><span>{label}</span><strong>{value}</strong></div>
}

function RouteMap({ rakes }) {
  return (
    <section className="panel content-stack">
      <div className="panel-heading">
        <div><span className="eyebrow">MODULE THREE / SCHEMATIC ROUTE MAP</span><h2>Live Line 1 Route (Aluva ↔ Thripunithura)</h2></div>
        <span>TOTAL DISTANCE: 28.1 KM · 23 STATIONS</span>
      </div>
      <div className="station-track">
        <div className="station-line" />
        {STATIONS.map((station, index) => (
          <div className="station" key={station} title={`${station} · Station ${index + 1}`}>
            <i /><span>{station}</span>
          </div>
        ))}
      </div>
      <div className="panel-heading"><div><h2>Fleet Records</h2><p>Vehicles currently recorded by the connected backend</p></div></div>
      {rakes.length ? <RakeTable rakes={rakes} compact /> : <p className="empty-state">No fleet records available.</p>}
    </section>
  )
}

function Safety({ activeSafetyHolds }) {
  return (
    <div className="content-stack">
      <section className="panel">
        <div className="panel-heading">
          <div><span className="eyebrow">MODULE FOUR / SAFETY DESK</span><h2>Safety, Interlocks &amp; Incident Audit</h2></div>
          <span className="status-badge status-amber">{activeSafetyHolds} ACTIVE SAFETY HOLD</span>
        </div>
        <div className="safety-notice">
          <strong>Interface status only</strong>
          <p>The current backend exposes fleet record endpoints only. It does not provide interlock or emergency-control APIs; no safety command is sent from this screen.</p>
        </div>
      </section>
    </div>
  )
}

function Analytics({ metrics, rakes }) {
  const fitRate = metrics.total ? Math.round((metrics.fitReady / metrics.total) * 100) : 0
  return (
    <div className="content-stack">
      <section className="metric-grid analytics-metrics">
        <div className="metric-card metric-navy"><span>TOTAL MILEAGE LOGGED</span><strong>{metrics.mileage.toLocaleString()} km</strong><small>Across stored fleet records</small></div>
        <div className="metric-card metric-teal"><span>FITNESS COMPLIANCE</span><strong>{fitRate}% Fit Ready</strong><small>{metrics.fitReady} of {metrics.total} rakes</small></div>
        <div className="metric-card metric-green"><span>FLEET RECORDS</span><strong>{metrics.total}</strong><small>Loaded from the backend API</small></div>
      </section>
      <section className="panel">
        <div className="panel-heading"><div><h2>Rake Fitness Certificate Matrix</h2><p>Fitness expiry details from the database</p></div></div>
        {rakes.length ? <RakeTable rakes={rakes} compact /> : <p className="empty-state">No fleet records available.</p>}
      </section>
    </div>
  )
}

export default App
