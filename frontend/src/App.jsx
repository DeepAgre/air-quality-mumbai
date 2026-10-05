import React, { useState } from 'react';
import { 
  CloudRain, 
  MapPin, 
  Sun, 
  DownloadCloud, 
  AlertCircle,
  ShieldCheck,
  Info
} from 'lucide-react';

export default function App() {
  const defaultValues = [65.4, 72.1, 68.5, 74.2, 81.0, 79.3, 85.6, 90.2, 88.4, 92.1, 95.0, 91.8, 89.2, 93.5, 96.4, 99.1, 94.5, 92.8, 97.0, 102.3];
  
  const [inputs, setInputs] = useState(defaultValues);
  // Hardcoded to always request 3 days of predictions
  const forecastDays = 3;
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
        <div className="relative bg-[#F2F5FE]/80 backdrop-blur-xl border border-white rounded-[2rem] p-5 px-8 flex justify-between items-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          
          {/* Left: Location */}
          <div className="hidden sm:flex items-center gap-2 text-slate-600 font-medium text-sm w-1/3">
            <MapPin className="w-4 h-4 text-slate-400" />
            Mumbai, Maharashtra
          </div>

          {/* Center: Title */}
          <div className="flex items-center justify-center gap-2 w-full sm:w-1/3">
            <CloudRain className="w-7 h-7 text-blue-600" />
            <span className="font-outfit font-extrabold text-2xl text-blue-600 tracking-tight">AirCast</span>
          </div>

          {/* Right: Spacer for perfect centering */}
          <div className="hidden sm:block w-1/3"></div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column (Forecast & About Section) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* 3-Day Output Card */}
            <div className="bg-[#F2F5FE]/80 backdrop-blur-xl border border-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-slate-500 font-medium text-sm">Prediction Output</h2>
                  <p className="text-slate-800 font-bold text-xl mt-1">3-Day PM2.5 Forecast</p>
                </div>
                {result && (
                  <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 shadow-sm text-sm font-bold text-emerald-700">
                    <ShieldCheck className="w-4 h-4" />
                    Confidence: {result.confidence}
                  </div>
                )}
              </div>

              {/* Forecast Display Area */}
              {result && result.multi_day_forecast ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                  {result.multi_day_forecast.map((val, idx) => (
                    <div key={idx} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                      <Sun className="w-10 h-10 text-yellow-500 mb-4" />
                      <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Day {idx + 1}</div>
                      <div className="text-5xl font-outfit font-extrabold text-slate-800">{val}</div>
                      <div className="text-sm font-medium text-slate-400 mt-2">µg/m³ PM2.5</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-slate-400 font-medium border-2 border-dashed border-slate-300 rounded-3xl mb-8 bg-slate-50/50">
                  Run the neural network forecast to generate multi-day predictions.
                </div>
              )}

              <div className="bg-white/60 p-4 rounded-2xl border border-white">
                <p className="text-slate-600 font-medium leading-relaxed">
                  <span className="font-bold text-slate-800">Health Advisory: </span> 
                  {result ? result.description : 'Awaiting sequence analysis to provide targeted health and outdoor activity guidance.'}
                </p>
              </div>
            </div>

            {/* About The Project Card */}
            <div className="bg-[#F2F5FE]/80 backdrop-blur-xl border border-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex-1">
              <h3 className="text-xl font-outfit font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                About This Project
              </h3>
              <div className="space-y-5 text-slate-600 font-medium text-sm leading-relaxed">
                <p>
                  <strong className="text-slate-800">AirCast</strong> was conceptualized and developed by a dedicated group of 5 M.Sc. Computer Science students from <strong className="text-slate-800">Ramnarain Ruia Autonomous College, Mumbai</strong>. Our primary objective is to address the severe and growing concern of urban air pollution by providing an accessible, highly accurate environmental forecasting tool for the citizens of Mumbai.
                </p>
                <p>
                  Unlike traditional weather applications that only display current statistics, this platform uncovers hidden temporal dependencies in the atmosphere. By analyzing rolling 20-day historical data arrays, our system can identify pollution trends and predict hazardous particulate matter (PM2.5) spikes before they happen, granting vulnerable populations crucial early warnings.
                </p>
                <p>
                  <strong className="text-slate-800">Technical Infrastructure:</strong> At the core of the application lies a sophisticated Recurrent Neural Network (RNN), heavily optimized via ONNX Runtime to execute deep-learning inference in milliseconds. This model is served by a highly concurrent Python FastAPI backend, while the user interface is built strictly with React and Tailwind CSS—bridging complex predictive modeling with clean, actionable public health awareness.
                </p>
              </div>
            </div>

          </div>

          {/* Right Column (List Sequence & Predict Button) */}
          <div className="lg:col-span-4 bg-[#F2F5FE]/80 backdrop-blur-xl border border-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[780px]">
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-5 text-sm font-semibold">
                <button className="text-slate-800 border-b-2 border-slate-800 pb-1">Historical Input Data</button>
                <button onClick={handleReset} className="text-slate-400 hover:text-slate-600 pb-1">Reset</button>
              </div>
              <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="bg-slate-900 text-white text-xs px-5 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Run Forecast'}
              </button>
            </div>

            <button 
              onClick={fetchLiveData} 
              disabled={fetchingApi}
              className="w-full bg-blue-50 border border-blue-100 text-blue-600 font-semibold text-sm py-3.5 rounded-xl mb-6 flex items-center justify-center gap-2 hover:bg-blue-100 transition"
            >
              <DownloadCloud className={`w-4 h-4 ${fetchingApi ? 'animate-pulse' : ''}`} />
              {fetchingApi ? 'Fetching Data...' : 'Sync Live Open-Meteo Data'}
            </button>
            
            {error && <div className="text-red-500 text-xs font-medium mb-4 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}

            {/* Scrollable Sequence Inputs List */}
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