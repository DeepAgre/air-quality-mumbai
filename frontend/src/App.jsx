import React, { useState } from 'react';
import { CloudRain, ArrowDown, ShieldCheck, RefreshCw, Calendar } from 'lucide-react';

export default function App() {
  const defaultValues = [65.4, 72.1, 68.5, 74.2, 81.0, 79.3, 85.6, 90.2, 88.4, 92.1, 95.0, 91.8, 89.2, 93.5, 96.4, 99.1, 94.5, 92.8, 97.0, 102.3];
  
  const [inputs, setInputs] = useState(defaultValues);
  const [forecastDays, setForecastDays] = useState(1);
  const [loading, setLoading] = useState(false);
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

  const scrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://air-forecast-backend.onrender.com/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence: inputs, days: forecastDays })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.detail || 'Inference request failed');

      setResult(data);
      document.getElementById('simulator').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="top" className="min-h-screen bg-slate-900 text-slate-900 font-sans selection:bg-sky-500 selection:text-white">

      {/* Sunny Sky Background Image & Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1920&q=80')` }}></div>
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-sky-400/40 via-sky-200/60 to-white/90"></div>

      {/* Floating Glass Navigation */}
      <nav className="sticky top-4 z-50 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="backdrop-blur-xl bg-white/70 border border-white/50 rounded-full px-5 py-3 flex justify-between items-center shadow-xl">
          <a href="#top" onClick={scrollToTop} className="flex items-center space-x-2 cursor-pointer">
            <CloudRain className="w-5 h-5 text-sky-600 animate-pulse" />
            <span className="font-bold text-sm tracking-tight text-slate-900">AirForecast Mumbai</span>
          </a>
          <div className="hidden md:flex space-x-8 text-xs font-semibold text-slate-700">
            <a href="#about" className="hover:text-sky-600 transition">About</a>
            <a href="#rnn-architecture" className="hover:text-sky-600 transition">Model Architecture</a>
          </div>
          <a href="#simulator" className="bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-xs px-4 sm:px-5 py-2 rounded-full shadow-lg hover:opacity-90 transition">
            Check Air Quality
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-16 sm:pb-20 text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
          Predict Mumbai AQI with <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-700 bg-clip-text text-transparent">RNN</span>
        </h1>
        <p className="text-slate-700 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-medium px-4">
          Understanding tomorrow's atmosphere through advanced sequential modeling and continuous environmental data analysis.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 px-4">
          <a href="#simulator" className="w-full sm:w-auto bg-sky-600 hover:bg-sky-500 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-sky-600/20 transition flex items-center justify-center space-x-2">
            <span>Get Started</span>
            <ArrowDown className="w-4 h-4" />
          </a>
          <a href="#about" className="w-full sm:w-auto backdrop-blur-md bg-white/60 border border-white/80 hover:bg-white/80 text-slate-800 font-semibold px-8 py-4 rounded-2xl transition shadow-sm">
            Learn More
          </a>
        </div>
      </header>

      {/* About & Purpose Section */}
      <section id="about" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 border-t border-sky-200/60">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-sky-700 text-xs font-bold uppercase tracking-widest mb-3">Project Overview</div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">What is AirForecast Mumbai?</h2>
            <p className="text-slate-700 leading-relaxed mb-4 font-medium">
              This platform serves as an advanced environmental intelligence tool designed to monitor and forecast particulate matter levels across urban Mumbai. By analyzing sequential daily readings, the model uncovers temporal dependencies that traditional monitoring tools overlook.
            </p>
            <p className="text-slate-700 leading-relaxed font-medium">
              Developed as part of an M.Sc. Computer Science initiative at Ramnarain Ruia Autonomous College, this project bridges theoretical deep learning with real-world public health awareness.
            </p>
          </div>
          <div className="backdrop-blur-xl bg-white/70 border border-white/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-sky-600" />
              <span>Core Objectives</span>
            </h3>
            <ul className="space-y-4 text-sm text-slate-700 font-medium">
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-sky-600 mt-2 shrink-0"></div>
                <span>Provide early warnings for hazardous particulate spikes across the city.</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-sky-600 mt-2 shrink-0"></div>
                <span>Implement optimized recurrent architectures to track rolling weather trends.</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-sky-600 mt-2 shrink-0"></div>
                <span>Deliver an intuitive workspace for testing custom emission scenarios.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* RNN Architecture Narrative Section */}
      <section id="rnn-architecture" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 border-t border-sky-200/60">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="text-sky-700 text-xs font-bold uppercase tracking-widest mb-3">Deep Learning Mechanism</div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">How Our Neural Network Forecasts Air Quality</h2>
          <p className="text-slate-700 text-sm font-medium">Understanding how past atmospheric conditions shape future predictions.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4 text-slate-700 text-sm sm:text-base font-medium leading-relaxed">
            <p>
              Air pollution does not happen in isolation. Atmospheric stagnation, wind directions, and continuous emissions create a chain reaction where yesterday's air quality directly influences today and tomorrow.
            </p>
            <p>
              To capture this behavior, our system utilizes a <strong className="text-slate-900">Recurrent Neural Network (RNN)</strong>. Unlike standard models that look at isolated snapshots, an RNN passes a "hidden memory state" sequentially across a 20-day timeline. 
            </p>
            <p>
              Combined with sparse attention routing, the model automatically filters out short-term statistical noise while focusing intensely on heavy pollutant accumulation trends, ensuring reliable predictions.
            </p>
          </div>
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/50 h-[320px] sm:h-[380px]">
            <img 
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1000&q=80" 
              alt="Digital data and atmospheric intelligence network" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Simulator Workspace Section */}
      <section id="simulator" className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20 border-t border-sky-200/60">
        <div className="backdrop-blur-2xl bg-white/80 border border-white/90 rounded-3xl p-6 sm:p-12 shadow-2xl">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 mb-8 border-b border-slate-200 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">20-Day Sequence Simulation Workspace</h2>
              <p className="text-slate-600 text-sm mt-1">Review historical particulate measurements or adjust values to test custom scenarios.</p>
            </div>
            <button type="button" onClick={handleReset} className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-700 hover:bg-sky-100 transition font-semibold">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Sample Array</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <div className="text-xs uppercase tracking-wider text-slate-600 font-bold">Historical Daily Inputs (PM2.5 in µg/m³)</div>
                
                {/* Forecast Horizon Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" /> Horizon:
                  </span>
                  {[1, 2, 3].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForecastDays(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        forecastDays === d
                          ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {d === 1 ? '1 Day' : `${d} Days`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[380px] overflow-y-auto pr-2">
                {inputs.map((val, idx) => (
                  <div key={idx} className="flex flex-col bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-bold text-slate-600">Day {idx + 1}</span>
                      <span className="text-[9px] text-sky-600 font-mono font-bold">T-{19 - idx}</span>
                    </div>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={val} 
                      onChange={(e) => handleInputChange(idx, e.target.value)}
                      required 
                      className="bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-lg p-2 text-sm font-mono text-slate-900 outline-none transition"
                    />
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-700 rounded-2xl text-sm font-semibold">
                Error: {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-sky-600 to-blue-600 hover:opacity-90 text-white font-bold rounded-2xl transition shadow-xl text-base tracking-wide cursor-pointer disabled:opacity-50">
              {loading ? "Analyzing Air Patterns..." : `Forecast Air Quality (${forecastDays} ${forecastDays === 1 ? 'Day' : 'Days'})`}
            </button>
          </form>

          {result && (
            <div className="mt-8 p-6 bg-slate-900 text-white border border-sky-500/30 rounded-2xl transition-all duration-300 shadow-xl space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Model Output & Multi-Step Assessment</div>
                <div className="text-xs font-mono text-sky-400">Horizon: {forecastDays} {forecastDays === 1 ? 'Day' : 'Days'}</div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                  <div className="text-3xl sm:text-4xl font-black text-sky-400">{result.forecast_pm25} µg/m³</div>
                  <div className="text-xs text-slate-300 mt-1">Next-Day (T+1) Predicted PM2.5 Concentration</div>
                </div>
                <div className="px-5 py-3 rounded-xl border text-sm font-semibold tracking-wide bg-sky-500/10 border-sky-500/30 text-sky-300">
                  {result.aqi_category} Category
                </div>
              </div>

              {result.multi_day_forecast && result.multi_day_forecast.length > 1 && (
                <div className="pt-4 border-t border-slate-800">
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">Multi-Day Rollout Projection</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {result.multi_day_forecast.map((val, i) => (
                      <div key={i} className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-xl">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Day {i + 1} (T+{i + 1})</div>
                        <div className="text-lg font-bold font-mono text-sky-300 mt-0.5">{val} µg/m³</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-sky-200/80 bg-white/80 backdrop-blur-md py-8 px-4 sm:px-6 text-center text-xs text-slate-600">
        <p className="mb-1 font-semibold text-slate-800">Master of Science Computer Science Project</p>
        <p className="text-slate-500">Ramnarain Ruia Autonomous College, Matunga, Mumbai</p>
      </footer>

    </div>
  );
}