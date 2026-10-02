import { useState, useEffect } from 'react'

function App() {
  const [rakes, setRakes] = useState([])
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
    console.log("Submitting form data:", formData) // Check your console to see if this runs

    fetch('http://localhost:8080/api/rakes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Server returned status ' + response.status)
      }
      return response.json()
    })
    .then(() => {
      loadRakes()
      setFormData({ rakeNumber: '', totalMileage: '', status: 'FIT_FOR_SERVICE', fitnessExpiryDate: '' })
    })
    .catch(error => {
      console.error('Error saving train:', error)
      alert('Failed to save train. Check your browser console or Spring Boot terminal.')
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-40px)] bg-occ-surface rounded-xl overflow-hidden shadow-2xl border border-occ-border text-occ-textPrimary text-sm">
      
      {/* TOP HEADER */}
      <header className="h-12 border-b border-occ-border flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <span className="font-bold text-xs uppercase font-mono-data">🚇 METRO TELEMETRY / OCC-HQ</span>
          <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200 text-[11px] font-mono-data font-medium tracking-wide">
            ● SYS.ONLINE
          </span>
          <span className="text-xs font-mono-data text-occ-textSecondary">UTC: 2026.10.02 10:23:53</span>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono-data">
          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded font-semibold border border-amber-200">1 SAFETY HOLD</span>
          <span className="font-bold border-l border-occ-border pl-3">DISPATCHER.4</span>
        </div>
      </header>

      {/* SUB HEADER */}
      <section className="border-b border-occ-border bg-occ-surfaceAlt px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase font-mono-data text-occ-textMuted font-semibold">ROLLING STOCK TELEMETRY</div>
          <h1 className="text-lg font-bold">Operations Control Center</h1>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-occ-panel border border-occ-border rounded text-xs font-mono-data font-semibold text-occ-textSecondary">EXPORT TELEMETRY</button>
          <button className="px-3 py-1.5 bg-occ-amber text-white rounded text-xs font-mono-data font-bold shadow-sm">DISPATCH EXTRA CONSIST</button>
          <button className="px-3 py-1.5 bg-red-50 text-occ-red border border-red-200 rounded text-xs font-mono-data font-bold">ALL STOP PROTOCOL</button>
        </div>
      </section>

      {/* 3-COLUMN MAIN LAYOUT */}
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
          
          {/* Add Train Form */}
          <div className="p-4 border-b border-occ-border bg-occ-base">
            <h3 className="font-bold text-xs uppercase font-mono-data mb-2 text-occ-textSecondary">Inject New Telemetry Data</h3>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input type="text" name="rakeNumber" placeholder="Rake # (R-102)" value={formData.rakeNumber} onChange={handleChange} required className="px-3 py-1.5 text-xs bg-occ-surface border border-occ-border rounded flex-1 font-mono-data" />
              <input type="number" name="totalMileage" placeholder="Mileage (km)" value={formData.totalMileage} onChange={handleChange} required className="px-3 py-1.5 text-xs bg-occ-surface border border-occ-border rounded w-32 font-mono-data" />
              <input type="date" name="fitnessExpiryDate" value={formData.fitnessExpiryDate} onChange={handleChange} required className="px-3 py-1.5 text-xs bg-occ-surface border border-occ-border rounded w-40 font-mono-data" />
              <button type="submit" className="px-4 py-1.5 bg-occ-blue text-white rounded text-xs font-mono-data font-bold shadow-sm">+ ADD TRAIN</button>
            </form>
          </div>

          {/* Table Filters */}
          <div className="p-3 border-b border-occ-border flex gap-2">
            <span className="px-3 py-1 rounded bg-occ-panel border border-occ-border font-mono-data text-xs font-bold">All ({rakes.length})</span>
            <span className="px-3 py-1 rounded text-occ-textSecondary font-mono-data text-xs">Red Line M1</span>
            <span className="px-3 py-1 rounded text-occ-textSecondary font-mono-data text-xs">Blue Line M2</span>
          </div>

          {/* Main Table */}
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-occ-surfaceAlt sticky top-0 border-b border-occ-border text-occ-textMuted font-mono-data text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4 font-semibold">Unit & Line</th>
                <th className="py-3 px-4 font-semibold">Operational Status</th>
                <th className="py-3 px-4 font-semibold">Total Mileage</th>
                <th className="py-3 px-4 font-semibold">Fitness Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-occ-border font-mono-data">
              {rakes.map(rake => (
                <tr key={rake.id} className="hover:bg-occ-base transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-bold text-sm text-occ-textPrimary">{rake.rakeNumber}</div>
                    <div className="text-[10px] text-occ-textMuted mt-1">ID: #{rake.id}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                      rake.status === 'FIT_FOR_SERVICE' 
                      ? 'bg-green-50 text-occ-green border-green-200' 
                      : 'bg-amber-50 text-occ-amber border-amber-200'
                    }`}>
                      {rake.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-occ-textSecondary font-semibold">
                    {rake.totalMileage.toLocaleString()} km
                  </td>
                  <td className="py-4 px-4 text-occ-textSecondary">
                    {rake.fitnessExpiryDate}
                  </td>
                </tr>
              ))}
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
               {rakes.filter(r => r.status === 'FIT_FOR_SERVICE').length} <span className="text-xs font-semibold px-1 rounded bg-green-100 border border-green-200">READY</span>
            </div>
          </div>

          <div className="bg-occ-surface border border-occ-border rounded p-3">
            <div className="text-[10px] text-occ-textMuted uppercase font-mono-data font-bold mb-2">On-Time Index</div>
            <div className="text-2xl font-bold font-mono-data text-occ-textPrimary">98.4%</div>
            <div className="text-[10px] text-occ-textMuted mt-1 font-mono-data">HEADWAY ±14s AVG</div>
          </div>

        </aside>

      </main>
    </div>
  )
}

export default App