import { useState, useEffect } from 'react'

function App() {
  const [rakes, setRakes] = useState([])
  const [activeTab, setActiveTab] = useState('TELEMETRY') 
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('') // --- ADDED: Search query state ---
  const [formData, setFormData] = useState({
    rakeNumber: '',
    totalMileage: '',
    status: 'FIT_FOR_SERVICE',
    fitnessExpiryDate: ''
  })

  const loadRakes = () => {
    fetch('http://localhost:8080/api/rakes')
      .then(response => response.json())
      .then(data => setRakes(data))
      .catch(error => console.error('Error:', error))
  }

  useEffect(() => { loadRakes() }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    fetch('http://localhost:8080/api/rakes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    .then(response => {
      if (!response.ok) throw new Error('Server returned status ' + response.status)
      return response.json()
    })
    .then(() => {
      loadRakes()
      setFormData({ rakeNumber: '', totalMileage: '', status: 'FIT_FOR_SERVICE', fitnessExpiryDate: '' })
    })
    .catch(error => {
      console.error('Error saving train:', error)
      alert('Failed to save train. Check if Rake Number already exists.')
    })
  }

  const handleDelete = (id) => {
    fetch(`http://localhost:8080/api/rakes/${id}`, {
      method: 'DELETE',
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to delete train')
      setRakes(rakes.filter(rake => rake.id !== id))
    })
    .catch(error => {
      console.error('Error deleting train:', error)
      alert('Failed to delete train from database.')
    })
  }

  // --- ADDED: Quick Toggle Status Handler ---
  const handleToggleStatus = (rake) => {
    const updatedStatus = rake.status === 'FIT_FOR_SERVICE' ? 'MAINTENANCE' : 'FIT_FOR_SERVICE';
    const updatedRake = { ...rake, status: updatedStatus };

    fetch(`http://localhost:8080/api/rakes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedRake)
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to update status')
      return response.json()
    })
    .then(() => {
      loadRakes(); // Refresh list to show updated status
    })
    .catch(error => {
      console.error('Error updating status:', error);
      alert('Failed to update train status.');
    });
  }

  // --- Filter and Search Logic ---
  const filteredRakes = rakes.filter(rake => {
    const matchesFilter = activeFilter === 'ALL' || rake.status === activeFilter;
    const matchesSearch = rake.rakeNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Calculate analytics metrics dynamically
  const totalFleet = rakes.length;
  const fitCount = rakes.filter(r => r.status === 'FIT_FOR_SERVICE').length;
  const maintenanceCount = rakes.filter(r => r.status === 'MAINTENANCE').length;
  const totalSystemMileage = rakes.reduce((acc, r) => acc + Number(r.totalMileage || 0), 0);
  const avgMileage = totalFleet > 0 ? Math.round(totalSystemMileage / totalFleet) : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-40px)] bg-occ-surface rounded-xl overflow-hidden shadow-2xl border border-occ-border text-occ-textPrimary text-sm">
      
      {/* TOP HEADER */}
      <header className="h-12 border-b border-occ-border flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <span className="font-bold text-xs uppercase font-mono-data">🚇 METRO TELEMETRY / OCC-HQ</span>
          <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200 text-[11px] font-mono-data font-medium tracking-wide">
            ● SYS.ONLINE
          </span>
          <span className="text-xs font-mono-data text-occ-textSecondary">UTC: 2026.10.05 12:00:00</span>
        </div>
        
        {/* VIEW SWITCHER TABS */}
        <div className="flex items-center space-x-2 font-mono-data">
          <button 
            onClick={() => setActiveTab('TELEMETRY')}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${activeTab === 'TELEMETRY' ? 'bg-occ-blue text-white shadow-sm' : 'bg-occ-panel border border-occ-border text-occ-textSecondary hover:bg-occ-base'}`}
          >
            Live Telemetry
          </button>
          <button 
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${activeTab === 'ANALYTICS' ? 'bg-occ-blue text-white shadow-sm' : 'bg-occ-panel border border-occ-border text-occ-textSecondary hover:bg-occ-base'}`}
          >
            Fleet Analytics
          </button>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono-data">
          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded font-semibold border border-amber-200">1 SAFETY HOLD</span>
          <span className="font-bold border-l border-occ-border pl-3">DISPATCHER.4</span>
        </div>
      </header>

      {/* SUB HEADER */}
      <section className="border-b border-occ-border bg-occ-surfaceAlt px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase font-mono-data text-occ-textMuted font-semibold">
            {activeTab === 'TELEMETRY' ? 'ROLLING STOCK TELEMETRY' : 'SYSTEM METRICS & REPORTS'}
          </div>
          <h1 className="text-lg font-bold">
            {activeTab === 'TELEMETRY' ? 'Operations Control Center' : 'Fleet Analytics Dashboard'}
          </h1>
        </div>
        <div className="flex gap-2">
          <button onClick={loadRakes} className="px-3 py-1.5 bg-occ-panel border border-occ-border rounded text-xs font-mono-data font-semibold text-occ-textSecondary hover:bg-occ-base">REFRESH DATA</button>
        </div>
      </section>

      {/* CONDITIONAL BODY VIEW */}
      {activeTab === 'TELEMETRY' ? (
        <main className="flex-1 flex overflow-hidden">
          {/* LEFT COLUMN: DISPATCH CONTROLS */}
          <aside className="w-64 border-r border-occ-border bg-occ-surfaceAlt/30 flex flex-col overflow-y-auto">
            <div className="p-4 border-b border-occ-border">
              <h3 className="font-bold text-xs uppercase font-mono-data mb-3">OCC Dispatch Controls</h3>
              <div className="space-y-2">
                <button className="w-full py-2 bg-occ-amber text-white font-bold font-mono-data text-xs rounded">DISPATCH EXTRA</button>
                <button className="w-full py-2 bg-red-50 text-occ-red border border-red-200 font-bold font-mono-data text-xs rounded">ALL STOP PROTOCOL</button>
              </div>
            </div>
            <div className="p-4 border-b border-occ-border">
               <h3 className="font-bold text-[11px] uppercase font-mono-data text-occ-textMuted mb-2">Active Line Interlocks</h3>
               <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs">
                  <span className="font-bold text-occ-amber font-mono-data">TR-6031 // BLOCK S-88</span>
                  <p className="mt-2 text-occ-textSecondary text-[11px]">Interlock sensor wait signal. Track inspector team notified.</p>
               </div>
            </div>
          </aside>

          {/* CENTER COLUMN: TABLE & DATA ENTRY */}
          <div className="flex-1 flex flex-col bg-occ-surface overflow-auto">
            <div className="p-4 border-b border-occ-border bg-occ-base">
              <h3 className="font-bold text-xs uppercase font-mono-data mb-2 text-occ-textSecondary">Inject New Telemetry Data</h3>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input type="text" name="rakeNumber" placeholder="Rake # (R-102)" value={formData.rakeNumber} onChange={handleChange} required className="px-3 py-1.5 text-xs bg-occ-surface border border-occ-border rounded flex-1 font-mono-data" />
                <input type="number" name="totalMileage" placeholder="Mileage (km)" value={formData.totalMileage} onChange={handleChange} required className="px-3 py-1.5 text-xs bg-occ-surface border border-occ-border rounded w-32 font-mono-data" />
                
                <select name="status" value={formData.status} onChange={handleChange} className="px-3 py-1.5 text-xs bg-occ-surface border border-occ-border rounded font-mono-data">
                  <option value="FIT_FOR_SERVICE">FIT FOR SERVICE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>

                <input type="date" name="fitnessExpiryDate" value={formData.fitnessExpiryDate} onChange={handleChange} required className="px-3 py-1.5 text-xs bg-occ-surface border border-occ-border rounded w-40 font-mono-data" />
                <button type="submit" className="px-4 py-1.5 bg-occ-blue text-white rounded text-xs font-mono-data font-bold shadow-sm">+ ADD TRAIN</button>
              </form>
            </div>

            {/* Table Filters & Search Bar */}
            <div className="p-3 border-b border-occ-border flex items-center justify-between gap-4">
              <div className="flex gap-2">
                <button onClick={() => setActiveFilter('ALL')} className={`px-3 py-1 rounded font-mono-data text-xs font-bold transition-colors ${activeFilter === 'ALL' ? 'bg-occ-blue text-white shadow-sm' : 'bg-occ-panel border border-occ-border text-occ-textSecondary'}`}>
                  All ({rakes.length})
                </button>
                <button onClick={() => setActiveFilter('FIT_FOR_SERVICE')} className={`px-3 py-1 rounded font-mono-data text-xs font-bold transition-colors ${activeFilter === 'FIT_FOR_SERVICE' ? 'bg-occ-green text-white shadow-sm' : 'bg-occ-panel border border-occ-border text-occ-textSecondary'}`}>
                  Fit For Service
                </button>
                <button onClick={() => setActiveFilter('MAINTENANCE')} className={`px-3 py-1 rounded font-mono-data text-xs font-bold transition-colors ${activeFilter === 'MAINTENANCE' ? 'bg-occ-amber text-white shadow-sm' : 'bg-occ-panel border border-occ-border text-occ-textSecondary'}`}>
                  Maintenance
                </button>
              </div>

              {/* --- ADDED: Search input field --- */}
              <input 
                type="text" 
                placeholder="Search rake number..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1 text-xs bg-occ-surface border border-occ-border rounded w-48 font-mono-data focus:outline-none focus:border-occ-blue"
              />
            </div>

            {/* Main Table */}
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-occ-surfaceAlt sticky top-0 border-b border-occ-border text-occ-textMuted font-mono-data text-[10px] uppercase">
                <tr>
                  <th className="py-3 px-4 font-semibold">Unit & Line</th>
                  <th className="py-3 px-4 font-semibold">Operational Status</th>
                  <th className="py-3 px-4 font-semibold">Total Mileage</th>
                  <th className="py-3 px-4 font-semibold">Fitness Expiry</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-occ-border font-mono-data">
                {filteredRakes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-occ-textMuted font-mono-data">No rakes match your query.</td>
                  </tr>
                ) : (
                  filteredRakes.map(rake => (
                    <tr key={rake.id} className="hover:bg-occ-base transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-sm text-occ-textPrimary">{rake.rakeNumber}</div>
                        <div className="text-[10px] text-occ-textMuted mt-1">ID: #{rake.id}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                          rake.status === 'FIT_FOR_SERVICE' ? 'bg-green-50 text-occ-green border-green-200' : 'bg-amber-50 text-occ-amber border-amber-200'
                        }`}>
                          {rake.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-occ-textSecondary font-semibold">{rake.totalMileage.toLocaleString()} km</td>
                      <td className="py-4 px-4 text-occ-textSecondary">{rake.fitnessExpiryDate}</td>
                      <td className="py-4 px-4 text-right space-x-2">
                        {/* --- ADDED: Toggle Status Button --- */}
                        <button onClick={() => handleToggleStatus(rake)} className="px-2 py-1 bg-occ-panel hover:bg-occ-base border border-occ-border text-occ-textSecondary rounded font-mono-data text-[10px] font-bold transition-colors">
                          TOGGLE STATUS
                        </button>
                        <button onClick={() => handleDelete(rake.id)} className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded font-mono-data text-[10px] font-bold transition-colors">
                          DELETE
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* RIGHT COLUMN: KPIS */}
          <aside className="w-72 border-l border-occ-border bg-occ-surfaceAlt/30 flex flex-col p-4 space-y-4 overflow-y-auto">
            <div className="bg-occ-surface border border-occ-border rounded p-3">
              <div className="text-[10px] text-occ-textMuted uppercase font-mono-data font-bold mb-2">Active Consists</div>
              <div className="text-2xl font-bold font-mono-data text-occ-textPrimary">{rakes.length} <span className="text-xs text-occ-textMuted">/ 48</span></div>
            </div>
            <div className="bg-occ-surface border border-occ-border rounded p-3">
              <div className="text-[10px] text-occ-textMuted uppercase font-mono-data font-bold mb-2">Fit For Service</div>
              <div className="text-2xl font-bold font-mono-data text-occ-green">
                 {fitCount} <span className="text-xs font-semibold px-1 rounded bg-green-100 border border-green-200">READY</span>
              </div>
            </div>
            <div className="bg-occ-surface border border-occ-border rounded p-3">
              <div className="text-[10px] text-occ-textMuted uppercase font-mono-data font-bold mb-2">On-Time Index</div>
              <div className="text-2xl font-bold font-mono-data text-occ-textPrimary">98.4%</div>
              <div className="text-[10px] text-occ-textMuted mt-1 font-mono-data">HEADWAY ±14s AVG</div>
            </div>
          </aside>
        </main>
      ) : (
        /* --- ANALYTICS DASHBOARD VIEW --- */
        <main className="flex-1 p-6 overflow-y-auto bg-occ-surface flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono-data">
            <div className="bg-occ-panel border border-occ-border p-4 rounded-lg shadow-sm">
              <div className="text-[11px] text-occ-textMuted uppercase font-bold">Total Fleet Rakes</div>
              <div className="text-3xl font-extrabold mt-2 text-occ-blue">{totalFleet}</div>
              <div className="text-[10px] text-occ-textSecondary mt-1">Registered in database</div>
            </div>
            <div className="bg-occ-panel border border-occ-border p-4 rounded-lg shadow-sm">
              <div className="text-[11px] text-occ-textMuted uppercase font-bold">Operational Ready</div>
              <div className="text-3xl font-extrabold mt-2 text-occ-green">{fitCount}</div>
              <div className="text-[10px] text-occ-textSecondary mt-1">{totalFleet > 0 ? Math.round((fitCount / totalFleet) * 100) : 0}% of active fleet</div>
            </div>
            <div className="bg-occ-panel border border-occ-border p-4 rounded-lg shadow-sm">
              <div className="text-[11px] text-occ-textMuted uppercase font-bold">In Maintenance</div>
              <div className="text-3xl font-extrabold mt-2 text-occ-amber">{maintenanceCount}</div>
              <div className="text-[10px] text-occ-textSecondary mt-1">Requires depot service</div>
            </div>
            <div className="bg-occ-panel border border-occ-border p-4 rounded-lg shadow-sm">
              <div className="text-[11px] text-occ-textMuted uppercase font-bold">Avg Fleet Mileage</div>
              <div className="text-3xl font-extrabold mt-2 text-occ-textPrimary">{avgMileage.toLocaleString()} km</div>
              <div className="text-[10px] text-occ-textSecondary mt-1">Total: {totalSystemMileage.toLocaleString()} km</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-occ-panel border border-occ-border p-5 rounded-lg">
              <h3 className="font-bold text-xs uppercase font-mono-data mb-4 text-occ-textSecondary">Fleet Health Status Distribution</h3>
              <div className="space-y-4 font-mono-data">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Fit For Service Rakes</span>
                    <span className="font-bold">{fitCount} / {totalFleet}</span>
                  </div>
                  <div className="w-full bg-occ-base h-2.5 rounded-full overflow-hidden border border-occ-border">
                    <div className="bg-occ-green h-full transition-all duration-500" style={{ width: `${totalFleet > 0 ? (fitCount / totalFleet) * 100 : 0}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Maintenance Rakes</span>
                    <span className="font-bold">{maintenanceCount} / {totalFleet}</span>
                  </div>
                  <div className="w-full bg-occ-base h-2.5 rounded-full overflow-hidden border border-occ-border">
                    <div className="bg-occ-amber h-full transition-all duration-500" style={{ width: `${totalFleet > 0 ? (maintenanceCount / totalFleet) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-occ-panel border border-occ-border p-5 rounded-lg flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-xs uppercase font-mono-data mb-2 text-occ-textSecondary">System Operational Status</h3>
                <p className="text-xs text-occ-textSecondary leading-relaxed font-mono-data">
                  All nodes communicating smoothly with Spring Boot backend via REST endpoints. MySQL database consistency verified. Live telemetry feeds operating within nominal latency thresholds.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-occ-border flex justify-between items-center font-mono-data text-xs">
                <span className="text-occ-green font-bold">● ALL SYSTEMS NOMINAL</span>
                <span className="text-occ-textMuted">SECURE PROTOCOL v2.4</span>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  )
}

export default App