import React, { useState } from 'react';
import { 
  CloudRain, 
  MapPin, 
  ShieldCheck, 
  RefreshCw, 
  Calendar, 
  Cpu, 
  DownloadCloud, 
  Wind, 
  Activity, 
  AlertCircle,
  Sparkles,
  Search,
  SunMedal,
  Gauge
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
      alert("Failed to fetch live API data. Please try again.");
    } finally {
      setFetchingApi(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="min-h-screen bg-[#E5E9FE] text-slate-800 p-3 sm:p-6 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-indigo-500 selection:text-white">
      {/* Inject Google Luxury Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif; }
      `}</style>

      {/* Main Container Dashboard */}
      <div className="max-w-[1400px] mx-auto space-y-5">

        {/* Header Bar */}
        <header className="bg-white/70 backdrop-blur-md border border-white/80 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
          <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
                <CloudRain className="w-6 h-6" />
              </div>
              <div>
                <span className="font-outfit font-extrabold text-lg text-slate-900 tracking-tight block">AirForecast</span>
                <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase block">M.Sc. CS Project</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-[#F1F4FF] px-3 py-1.5 rounded-full border border-indigo-100/60 text-xs text-slate-700 font-medium">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span>Mumbai, MH</span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <button
              onClick={fetchLiveData}
              disabled={fetchingApi}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
            >
              <DownloadCloud className={`w-3.5 h-3.5 text-indigo-600 ${fetchingApi ? 'animate-bounce' : ''}`} />
              <span>{fetchingApi ? 'Syncing Live API...' : 'Fetch Live Mumbai Data'}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-sm"
              title="Reset Inputs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dashboard Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left Column (Main Metrics Bento) */}
          <div className="lg:col-span-8 space-y-5">

            {/* Hero Summary Card */}
            <div className="bg-white/70 backdrop-blur-md border border-white/90 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Target Location</span>
                  <h1 className="text-2xl sm:text-3xl font-outfit font-extrabold text-slate-900 tracking-tight">
                    Mumbai Air Quality Prediction
                  </h1>
                </div>

                {/* Forecast Horizon Switcher */}
                <div className="bg-[#F1F4FF] p-1 rounded-xl flex items-center space-x-1 border border-indigo-100">
                  {[1, 2, 3].map((d) => (
                    <button
                      key={d}
                      onClick={() => setForecastDays(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        forecastDays === d
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {d === 1 ? 'Next Day' : `${d} Days`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Output Box */}
              <div className="bg-[#F6F8FF] border border-indigo-100/80 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Forecasted PM2.5 Level</div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-5xl sm:text-6xl font-outfit font-extrabold text-slate-900">
                      {result ? result.forecast_pm25 : '--'}
                    </span>
                    <span className="text-lg font-bold text-slate-500">µg/m³</span>
                  </div>
                  <p className="text-xs font-medium text-slate-600 mt-2">
                    {result ? result.description : 'Run the RNN model using the sequence timeline to evaluate upcoming particulate levels.'}
                  </p>
                </div>

                {result && (
                  <div className="flex flex-col sm:items-end space-y-2 shrink-0">
                    <div className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{result.confidence} Confidence</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">Margin: {result.error_margin}</div>
                  </div>
                )}
              </div>
            </div>

            {/* 6 Bento Grid Feature Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white/70 backdrop-blur-md border border-white/90 p-4 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold">
                  <Wind className="w-4 h-4 text-indigo-600" />
                  <span>Pollutant</span>
                </div>
                <div className="text-xl font-outfit font-bold text-slate-900">PM2.5</div>
                <div className="text-[11px] text-slate-500 font-medium">Particulate Fine Matter</div>
              </div>

              <div className="bg-white/70 backdrop-blur-md border border-white/90 p-4 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  <span>ML Engine</span>
                </div>
                <div className="text-xl font-outfit font-bold text-slate-900">ONNX RNN</div>
                <div className="text-[11px] text-slate-500 font-medium">Recurrent Neural Net</div>
              </div>

              <div className="bg-white/70 backdrop-blur-md border border-white/90 p-4 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Input Window</span>
                </div>
                <div className="text-xl font-outfit font-bold text-slate-900">20 Days</div>
                <div className="text-[11px] text-slate-500 font-medium">Sequential Historical Array</div>
              </div>

              <div className="bg-white/70 backdrop-blur-md border border-white/90 p-4 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span>Execution Speed</span>
                </div>
                <div className="text-xl font-outfit font-bold text-slate-900">&lt; 20 ms</div>
                <div className="text-[11px] text-slate-500 font-medium">FastAPI Asynchronous</div>
              </div>

              <div className="bg-white/70 backdrop-blur-md border border-white/90 p-4 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold">
                  <Gauge className="w-4 h-4 text-indigo-600" />
                  <span>Horizon</span>
                </div>
                <div className="text-xl font-outfit font-bold text-slate-900">{forecastDays} Day(s)</div>
                <div className="text-[11px] text-slate-500 font-medium">Multi-step Rollout</div>
              </div>

              <div className="bg-white/70 backdrop-blur-md border border-white/90 p-4 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span>Coordinates</span>
                </div>
                <div className="text-xl font-outfit font-bold text-slate-900">19.07, 72.87</div>
                <div className="text-[11px] text-slate-500 font-medium">Greater Mumbai Region</div>
              </div>
            </div>

            {/* Health & Public Advisory Card */}
            <div className="bg-white/70 backdrop-blur-md border border-white/90 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Multi-Day Prediction Summary</span>
              </h3>

              {result && result.multi_day_forecast ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {result.multi_day_forecast.map((val, i) => (
                    <div key={i} className="bg-[#F8FAFF] border border-indigo-100 p-4 rounded-2xl flex flex-col justify-between">
                      <div className="text-xs font-bold text-slate-500 uppercase">Day {i + 1} (T+{i + 1})</div>
                      <div className="text-2xl font-outfit font-extrabold text-slate-900 mt-2">{val} µg/m³</div>
                      <div className="text-[10px] text-indigo-600 font-semibold mt-1">Forecasted PM2.5</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs font-medium text-slate-500 bg-[#F8FAFF] rounded-2xl border border-indigo-50">
                  Click <strong className="text-slate-800">"Run Neural Network Forecast"</strong> in the right panel to generate multi-day predictions.
                </div>
              )}
            </div>

          </div>

          {/* Right Column (20-Day Interactive Sequence Timeline) */}
          <div className="lg:col-span-4">
            <div className="bg-white/80 backdrop-blur-md border border-white/90 rounded-3xl p-5 shadow-sm space-y-4 sticky top-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-outfit font-bold text-slate-900">Historical Timeline</h2>
                  <p className="text-[11px] text-slate-500 font-medium">20-Day PM2.5 Input Sequence</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase tracking-wide">
                  Editable
                </span>
              </div>

              {/* Scrollable Sequence Inputs */}
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {inputs.map((val, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-[#F8FAFF] border border-slate-100 p-2.5 rounded-xl transition hover:border-indigo-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-100/70 text-indigo-700 font-mono text-[10px] font-bold flex items-center justify-center">
                        D{idx + 1}
                      </div>
                      <span className="text-xs font-semibold text-slate-600">Day {idx + 1} (T-{19 - idx})</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        step="0.1"
                        value={val}
                        onChange={(e) => handleInputChange(idx, e.target.value)}
                        className="w-16 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-2 py-1 text-right text-xs font-mono font-bold text-slate-900 outline-none"
                      />
                      <span className="text-[10px] font-bold text-slate-400">µg</span>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Big Dark Action Button */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-outfit font-bold rounded-2xl transition shadow-lg text-sm tracking-wide cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>Evaluating Sequence...</span>
                ) : (
                  <>
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    <span>Run Neural Network Forecast</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="text-center py-4 text-xs font-medium text-slate-500">
          Ramnarain Ruia Autonomous College • M.Sc. Computer Science • AirForecast Mumbai Platform
        </footer>

      </div>
    </div>
  );
}