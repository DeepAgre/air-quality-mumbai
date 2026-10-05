import React, { useState } from 'react';
import { 
  CloudRain, 
  MapPin, 
  Search, 
  Moon, 
  Sun, 
  Wind, 
  Eye, 
  Activity, 
  Thermometer, 
  DownloadCloud, 
  Cpu, 
  RefreshCw, 
  AlertCircle,
  Menu,
  ChevronDown
} from 'lucide-react';

export default function App() {
  const defaultValues = [65.4, 72.1, 68.5, 74.2, 81.0, 79.3, 85.6, 90.2, 88.4, 92.1, 95.0, 91.8, 89.2, 93.5, 96.4, 99.1, 94.5, 92.8, 97.0, 102.3];
  
  const [inputs, setInputs] = useState(defaultValues);
  const [forecastDays, setForecastDays] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingApi, setFetchingApi] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (index, value) => {
    const updated = [...inputs];
    updated[index] = parseFloat(value) || 0;
    setInputs(updated);
  };

  const handleReset = () => {
    setInputs(defaultValues);
    setForecastDays(1);
    setResult(null);
    setError(null);
  };

  const fetchLiveData = async () => {
    setFetchingApi(true);
    try {
      const response = await fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=19.0760&longitude=72.8777&hourly=pm2_5&past_days=20&forecast_days=0');
      const data = await response.json();
      const pm25Hourly = data.hourly.pm2_5;
      const dailyPM25 = [];
      for (let i = 0; i < 20; i++) {
        const value = pm25Hourly[i * 24 + 12] || pm25Hourly[i * 24] || 0;
        dailyPM25.push(parseFloat(value.toFixed(1)));
      }
      setInputs(dailyPM25);
    } catch (err) {
      console.error("Error fetching live data:", err);
      alert("Failed to fetch live API data.");
    } finally {
      setFetchingApi(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('https://air-forecast-backend.onrender.com/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence: inputs, days: forecastDays })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.detail || 'Inference request failed');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E2E8FE] via-[#E8EDFF] to-[#DDE5FE] p-4 sm:p-8 font-sans selection:bg-indigo-500 selection:text-white flex justify-center items-center">
      
      {/* Luxury Font Injection */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif; }
      `}</style>

      {/* Main App Container */}
      <div className="max-w-[1300px] w-full flex flex-col gap-6">

        {/* Top Navbar */}
        <div className="bg-[#F2F5FE]/80 backdrop-blur-xl border border-white rounded-[2rem] p-4 px-6 flex flex-wrap justify-between items-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] gap-4">
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Menu className="w-5 h-5 text-slate-600" />
              <span className="font-outfit font-extrabold text-xl text-blue-600 tracking-tight">AirCast</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-slate-600 font-medium text-sm">
              <MapPin className="w-4 h-4 text-slate-400" />
              Mumbai, Maharashtra
            </div>
          </div>

          <div className="hidden md:flex items-center bg-white rounded-full px-4 py-2.5 w-72 shadow-sm border border-slate-100">
            <Search className="w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search Location" className="bg-transparent border-none outline-none ml-3 text-sm w-full text-slate-700" disabled />
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex items-center gap-4">
            <button className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-md">
              <Moon className="w-4 h-4" /> Dark
            </button>
            <div className="hidden sm:flex items-center gap-2 ml-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-200">
                DA
              </div>
              <span className="text-sm font-semibold text-slate-700">Deep Agre</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column (Forecast & Metrics) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Big Top Forecast Card */}
            <div className="bg-[#F2F5FE]/80 backdrop-blur-xl border border-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between h-[300px]">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-slate-500 font-medium text-sm">Current Output</h2>
                  <p className="text-slate-800 font-bold text-lg mt-1">{result ? 'Generated Forecast' : 'Awaiting Sequence'}</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm text-sm font-semibold text-slate-700">
                  <select 
                    value={forecastDays}
                    onChange={(e) => setForecastDays(Number(e.target.value))}
                    className="bg-transparent outline-none cursor-pointer"
                  >
                    <option value={1}>1 Day Horizon</option>
                    <option value={2}>2 Day Horizon</option>
                    <option value={3}>3 Day Horizon</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-8">
                {/* Weather Icon Mock */}
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full shadow-lg shadow-orange-200 relative">
                  <div className="absolute -bottom-2 -left-4 bg-white/30 backdrop-blur-md rounded-full w-20 h-10 border border-white/40"></div>
                </div>
                
                <div>
                  <div className="flex items-start gap-1">
                    <h1 className="text-7xl font-outfit font-bold text-slate-800 tracking-tighter">
                      {result ? result.forecast_pm25 : '--'}
                    </h1>
                    <span className="text-2xl text-slate-500 font-medium mt-2">µg/m³</span>
                  </div>
                  <p className="text-slate-600 text-lg font-medium mt-1">
                    PM2.5 <span className="text-slate-400 text-sm ml-3">Confidence: {result ? result.confidence : 'N/A'}</span>
                  </p>
                </div>
              </div>

              <p className="text-slate-600 font-medium mt-4">
                {result ? result.description : 'Run the neural network sequence on the right panel to generate public health advisories and upcoming particulate matter levels.'}
              </p>
            </div>

            {/* 6 Grid Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { label: 'Pollutant', val: 'PM2.5', icon: Activity, sub: 'Particulate Matter' },
                { label: 'ML Engine', val: 'RNN', icon: Cpu, sub: 'ONNX Runtime' },
                { label: 'API Status', val: 'Active', icon: DownloadCloud, sub: 'FastAPI Connected' },
                { label: 'Location', val: 'Mumbai', icon: MapPin, sub: 'Maharashtra' },
                { label: 'Speed', val: '<20ms', icon: Wind, sub: 'Inference Time' },
                { label: 'Sequence', val: '20 Days', icon: Eye, sub: 'Historical Array' }
              ].map((item, i) => (
                <div key={i} className="bg-[#F2F5FE]/80 backdrop-blur-xl border border-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-2">
                    <item.icon className="w-4 h-4 text-slate-400" />
                    {item.label}
                  </div>
                  <div className="text-2xl font-outfit font-bold text-slate-800">{item.val}</div>
                  <div className="text-xs text-slate-500 font-medium mt-1">{item.sub}</div>
                </div>
              ))}
            </div>

            {/* Bottom Multi-Day Card */}
            <div className="bg-[#F2F5FE]/80 backdrop-blur-xl border border-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="text-slate-500 font-medium mb-6">Multi-Day Rollout Summary</h3>
              {result && result.multi_day_forecast ? (
                <div className="flex gap-12">
                  {result.multi_day_forecast.map((val, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                      <div className="text-slate-800 font-semibold flex items-center gap-2">
                        <Sun className="w-5 h-5 text-yellow-500" /> Day {idx + 1}
                      </div>
                      <div className="text-3xl font-outfit font-bold text-slate-800">{val}</div>
                      <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">PM2.5 Forecast</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm font-medium text-slate-400">Run forecast to see multi-day timeline.</div>
              )}
            </div>

          </div>

          {/* Right Column (List Sequence & Predict Button) */}
          <div className="lg:col-span-4 bg-[#F2F5FE]/80 backdrop-blur-xl border border-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[750px]">
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-5 text-sm font-semibold">
                <button className="text-slate-800 border-b-2 border-slate-800 pb-1">Historical Sequence</button>
                <button onClick={handleReset} className="text-slate-400 hover:text-slate-600 pb-1">Reset</button>
              </div>
              <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="bg-slate-900 text-white text-xs px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Run Forecast'}
              </button>
            </div>

            <button 
              onClick={fetchLiveData} 
              disabled={fetchingApi}
              className="w-full bg-blue-50 border border-blue-100 text-blue-600 font-semibold text-sm py-3 rounded-xl mb-6 flex items-center justify-center gap-2 hover:bg-blue-100 transition"
            >
              <DownloadCloud className={`w-4 h-4 ${fetchingApi ? 'animate-pulse' : ''}`} />
              {fetchingApi ? 'Fetching Data...' : 'Sync Live Open-Meteo Data'}
            </button>
            
            {error && <div className="text-red-500 text-xs font-medium mb-4 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
              <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
              `}</style>
              
              {inputs.map((val, idx) => (
                <div key={idx} className="flex justify-between items-center py-4 border-b border-slate-200/60 last:border-0 hover:bg-white/40 rounded-xl px-2 transition">
                  <div className="flex items-center gap-4">
                    <CloudRain className="w-7 h-7 text-blue-400" />
                    <div>
                      <div className="text-slate-800 text-sm font-bold">Day {idx + 1}</div>
                      <div className="text-slate-400 text-xs font-medium">Input T-{19-idx}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <input 
                      type="number" 
                      step="0.1"
                      className="w-16 bg-transparent text-right font-outfit font-bold text-slate-800 text-xl outline-none focus:border-b focus:border-blue-300" 
                      value={val} 
                      onChange={(e) => handleInputChange(idx, e.target.value)}
                    />
                    <div className="text-[10px] text-slate-400 font-medium text-right leading-tight">
                      <div>µg/m³</div>
                      <div>PM2.5</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}