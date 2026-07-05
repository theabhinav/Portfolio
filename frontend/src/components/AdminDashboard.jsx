import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  LogOut, Download, Filter, RefreshCw, FileText, Database, 
  Users, Award, HelpCircle, GraduationCap, Search, X
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const COLORS = ['#7c6fff', '#4fd1ff', '#10b981', '#fbbf24', '#ef4444'];

export default function AdminDashboard() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
  const [responses, setResponses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Table Filtering & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [aiFilter, setAiFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [choiceFilter, setChoiceFilter] = useState('all');
  
  // Detailed response modal state
  const [selectedResponse, setSelectedResponse] = useState(null);
  
  const navigate = useNavigate();

  const fetchDashboardData = async (authToken) => {
    setLoading(true);
    const activeToken = authToken || token;
    if (!activeToken) {
      navigate('/admin/login');
      return;
    }
    try {
      const config = {
        headers: { Authorization: `Bearer ${activeToken}` }
      };

      const [resResponses, resStats] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/responses`, config),
        axios.get(`${API_BASE_URL}/admin/stats`, config)
      ]);

      setResponses(resResponses.data);
      setStats(resStats.data);
    } catch (err) {
      console.error(err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken('');
    navigate('/admin/login');
  };  const handleClearDatabase = async () => {
    const confirm1 = window.confirm("WARNING: This will permanently delete all participant survey responses from the database. This action cannot be undone.\n\nAre you sure you want to proceed?");
    if (!confirm1) return;
    
    const confirm2 = window.confirm("DOUBLE CONFIRMATION:\nAre you absolutely sure you want to WIPE the database clean? Click OK to delete all responses.");
    if (!confirm2) return;
    
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const response = await axios.delete(`${API_BASE_URL}/admin/responses/clear`, config);
      if (response.data.success) {
        alert("Database cleared successfully!");
        fetchDashboardData();
      }
    } catch (err) {
      alert("Error clearing database: " + (err.response?.data?.error || err.message));
    }
  };

  const triggerDownload = async (endpoint, filename) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      };
      const response = await axios.get(`${API_BASE_URL}/admin/export/${endpoint}?token=${token}`, config);
      
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error initiating export file download: ' + err.message);
    }
  };

  // Filtering rules
  const filteredResponses = responses.filter(item => {
    const matchesAI = aiFilter === 'all' || item.aiVersion === aiFilter;
    const matchesGender = genderFilter === 'all' || item.demographics.gender === genderFilter;
    const matchesChoice = choiceFilter === 'all' || item.mcq.careerChoice === choiceFilter;
    
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      item.participantId.toLowerCase().includes(query) ||
      item.demographics.grade.toLowerCase().includes(query) ||
      item.demographics.stream.toLowerCase().includes(query) ||
      item.openEnded.whyChoice.toLowerCase().includes(query) ||
      item.openEnded.influentialPart.toLowerCase().includes(query);

    return matchesAI && matchesGender && matchesChoice && matchesSearch;
  });

  // Recharts Formatters
  const getChoiceSplitData = () => {
    if (!stats) return [];
    return [
      {
        name: 'Direct',
        'Computer Science': stats.careerChoicePerVersion.direct.computer_science,
        'Medicine': stats.careerChoicePerVersion.direct.medicine
      },
      {
        name: 'Brief',
        'Computer Science': stats.careerChoicePerVersion.brief.computer_science,
        'Medicine': stats.careerChoicePerVersion.brief.medicine
      },
      {
        name: 'Detailed',
        'Computer Science': stats.careerChoicePerVersion.detailed.computer_science,
        'Medicine': stats.careerChoicePerVersion.detailed.medicine
      }
    ];
  };

  const getRatingsData = () => {
    if (!stats) return [];
    return [
      {
        name: 'Direct',
        'Confidence Rating': stats.avgConfidencePerVersion.direct,
        'AI Influence': stats.avgInfluencePerVersion.direct
      },
      {
        name: 'Brief',
        'Confidence Rating': stats.avgConfidencePerVersion.brief,
        'AI Influence': stats.avgInfluencePerVersion.brief
      },
      {
        name: 'Detailed',
        'Confidence Rating': stats.avgConfidencePerVersion.detailed,
        'AI Influence': stats.avgInfluencePerVersion.detailed
      }
    ];
  };

  const getGenderPieData = () => {
    if (!stats) return [];
    return Object.keys(stats.genderDistribution).map(g => ({
      name: g,
      value: stats.genderDistribution[g]
    })).filter(item => item.value > 0);
  };

  return (
    <div className="w-full max-w-[1300px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-heading bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
            Research Dashboard
          </h1>
          <p className="text-xs text-gray-400 font-mono">Independent Study Analytics Portal</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => fetchDashboardData()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-gray-300 hover:bg-white/5 transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button 
            onClick={handleClearDatabase}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600/15 border border-red-500/20 text-xs font-semibold text-red-400 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
          >
            <Database size={14} /> Clear Database
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/20 text-xs font-semibold text-red-400 hover:bg-red-500/25 transition-all cursor-pointer"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Stats KPI Overview */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="p-3 bg-[#7c6fff]/10 rounded-xl border border-[#7c6fff]/25 text-[#7c6fff]">
              <Users size={22} />
            </div>
            <div>
              <span className="block text-2xl font-bold font-heading text-white">{stats.total}</span>
              <span className="block text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Total Sample Size</span>
            </div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="p-3 bg-[#4fd1ff]/10 rounded-xl border border-[#4fd1ff]/25 text-[#4fd1ff]">
              <GraduationCap size={22} />
            </div>
            <div>
              <span className="block text-2xl font-bold font-heading text-white">
                {stats.total > 0 ? `${Math.round((stats.careerChoices.computer_science / stats.total) * 100)}%` : '0%'}
              </span>
              <span className="block text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Chose Comp Sci</span>
            </div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/25 text-emerald-400">
              <Award size={22} />
            </div>
            <div>
              <span className="block text-2xl font-bold font-heading text-white">{stats.avgConfidence}</span>
              <span className="block text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Avg Confidence</span>
            </div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/25 text-amber-400">
              <HelpCircle size={22} />
            </div>
            <div>
              <span className="block text-2xl font-bold font-heading text-white">{stats.avgInfluence}</span>
              <span className="block text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Avg AI Influence</span>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Chart 1: Career Choice Split */}
          <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-white/5 flex flex-col min-h-[340px]">
            <h3 className="text-sm font-bold font-heading text-gray-300 border-b border-white/5 pb-2 mb-4">
              Career Choice Split by AI Condition
            </h3>
            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChoiceSplitData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ background: '#0a0e17', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: '#9ca3af', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="Computer Science" fill="#7c6fff" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Medicine" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Ratings comparison */}
          <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-white/5 flex flex-col min-h-[340px]">
            <h3 className="text-sm font-bold font-heading text-gray-300 border-b border-white/5 pb-2 mb-4">
              Confidence & AI Influence Ratings (1-5)
            </h3>
            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getRatingsData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} domain={[0, 5]} />
                  <Tooltip 
                    contentStyle={{ background: '#0a0e17', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: '#9ca3af', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="Confidence Rating" fill="#4fd1ff" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="AI Influence" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Gender Distribution */}
          <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-white/5 flex flex-col min-h-[340px]">
            <h3 className="text-sm font-bold font-heading text-gray-300 border-b border-white/5 pb-2 mb-4">
              Gender Distribution
            </h3>
            <div className="flex-1 min-h-[220px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getGenderPieData()}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {getGenderPieData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#0a0e17', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ fontSize: 10 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Main Response Data Grid */}
      <div className="glass-panel rounded-2xl border border-white/5 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <h3 className="text-lg font-bold font-heading text-white">Participants' Submissions</h3>
          
          {/* Export Actions Panel */}
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => triggerDownload('csv', 'responses_export.csv')}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 text-xs font-semibold rounded-lg hover:bg-white/10 text-gray-300 transition-all"
            >
              <Download size={13} /> Export CSV
            </button>
            <button 
              onClick={() => triggerDownload('excel', 'responses_export.xlsx')}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#10b981]/15 border border-[#10b981]/25 text-xs font-semibold rounded-lg hover:bg-[#10b981]/25 text-emerald-400 transition-all"
            >
              <Download size={13} /> Export Excel (.xlsx)
            </button>
            <button 
              onClick={() => triggerDownload('json', 'responses_raw.json')}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#7c6fff]/15 border border-[#7c6fff]/25 text-xs font-semibold rounded-lg hover:bg-[#7c6fff]/25 text-[#7c6fff] transition-all"
            >
              <Database size={13} /> Python / Pandas JSON
            </button>
            <a 
              href={`${API_BASE_URL}/admin/export/python-script?token=${token}`}
              download="analyze_responses.py"
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold rounded-lg hover:bg-indigo-500/20 text-indigo-300 transition-all"
            >
              <FileText size={13} /> Fetch Script
            </a>
          </div>
        </div>

        {/* Filters bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-500" size={14} />
            <input 
              type="text" 
              placeholder="Search id, class, response..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#7c6fff] text-xs"
            />
          </div>

          {/* AI Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold font-heading">AI:</span>
            <select
              value={aiFilter}
              onChange={e => setAiFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 focus:outline-none focus:border-[#7c6fff] text-xs"
            >
              <option value="all">All Styles</option>
              <option value="direct">Direct Advice</option>
              <option value="brief">Brief Differentiating</option>
              <option value="detailed">Detailed Reflection</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold font-heading">Sex:</span>
            <select
              value={genderFilter}
              onChange={e => setGenderFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 focus:outline-none focus:border-[#7c6fff] text-xs"
            >
              <option value="all">All Options</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          {/* Choice Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold font-heading">Pick:</span>
            <select
              value={choiceFilter}
              onChange={e => setChoiceFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 focus:outline-none focus:border-[#7c6fff] text-xs"
            >
              <option value="all">All Choices</option>
              <option value="computer_science">Computer Science</option>
              <option value="medicine">Medicine</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto w-full rounded-xl border border-white/5 bg-black/15">
          <table className="w-full border-collapse text-left text-xs font-mono">
            <thead>
              <tr className="bg-white/5 border-b border-white/5 text-gray-300 font-heading">
                <th className="p-4 font-semibold uppercase tracking-wider">Date</th>
                <th className="p-4 font-semibold uppercase tracking-wider">Participant ID</th>
                <th className="p-4 font-semibold uppercase tracking-wider">Age/Sex/Class</th>
                <th className="p-4 font-semibold uppercase tracking-wider">AI Version</th>
                <th className="p-4 font-semibold uppercase tracking-wider">Choice</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-center">Confidence</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-center">Verify</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-center">Influence</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-center">Careful</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-400">
              {filteredResponses.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-12 text-center text-gray-500 font-mono">
                    No matching participant records found.
                  </td>
                </tr>
              ) : (
                filteredResponses.map((item) => (
                  <tr key={item._id} className="hover:bg-white/5 transition-all">
                    <td className="p-4 font-mono">
                      {new Date(item.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-4 font-mono text-[10px] text-gray-500" title={item.participantId}>
                      {item.participantId.substring(0, 8)}...
                    </td>
                    <td className="p-4 font-sans">
                      {item.demographics.age}y / {item.demographics.gender} / {item.demographics.grade}
                    </td>
                    <td className="p-4 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        item.aiVersion === 'direct' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                        item.aiVersion === 'brief' ? 'bg-[#7c6fff]/10 text-[#7c6fff] border-[#7c6fff]/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {item.aiVersion}
                      </span>
                    </td>
                    <td className="p-4 font-sans font-semibold">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        item.mcq.careerChoice === 'computer_science' 
                          ? 'bg-[#7c6fff]/10 text-indigo-400 border-indigo-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {item.mcq.careerChoice === 'computer_science' ? 'CompSci' : 'Medicine'}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-white">{item.mcq.confidence}</td>
                    <td className="p-4 text-center">{item.mcq.wouldVerify}</td>
                    <td className="p-4 text-center font-bold text-white">{item.mcq.aiInfluence}</td>
                    <td className="p-4 text-center">{item.mcq.helpedThinkCarefully}</td>
                    <td className="p-4 text-center font-sans">
                      <button 
                        onClick={() => setSelectedResponse(item)}
                        className="px-2.5 py-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded text-[10px] text-gray-300 font-semibold"
                      >
                        Read
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Response details popup modal */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-[#090b11] border border-white/10 rounded-2xl p-6 md:p-8 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-5">
              <h2 className="text-lg font-bold font-heading text-white">Participant Text Feedbacks</h2>
              <button 
                onClick={() => setSelectedResponse(null)}
                className="p-1 hover:bg-white/5 text-gray-500 hover:text-white rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-white/5 border border-white/5 rounded-xl text-xs font-mono text-gray-400 mb-6">
              <div><strong className="text-white block font-heading mb-0.5">Age:</strong> {selectedResponse.demographics.age}</div>
              <div><strong className="text-white block font-heading mb-0.5">Gender:</strong> {selectedResponse.demographics.gender}</div>
              <div><strong className="text-white block font-heading mb-0.5">Class/Stream:</strong> {selectedResponse.demographics.grade} / {selectedResponse.demographics.stream}</div>
              <div><strong className="text-white block font-heading mb-0.5">AI Version:</strong> {selectedResponse.aiVersion}</div>
            </div>

            <div className="space-y-4 font-sans">
              <div>
                <h4 className="text-xs font-bold font-heading text-[#4fd1ff] uppercase tracking-wider mb-1">
                  Why Choice?
                </h4>
                <p className="p-3 bg-black/30 border border-white/5 rounded-xl text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {selectedResponse.openEnded.whyChoice}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold font-heading text-[#4fd1ff] uppercase tracking-wider mb-1">
                  Which part of AI response influenced decision?
                </h4>
                <p className="p-3 bg-black/30 border border-white/5 rounded-xl text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {selectedResponse.openEnded.influentialPart}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold font-heading text-[#4fd1ff] uppercase tracking-wider mb-1">
                  Unhelpful or Misleading parts?
                </h4>
                <p className="p-3 bg-black/30 border border-white/5 rounded-xl text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {selectedResponse.openEnded.unhelpfulOrMisleading}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold font-heading text-[#4fd1ff] uppercase tracking-wider mb-1">
                  Improvement suggestions?
                </h4>
                <p className="p-3 bg-black/30 border border-white/5 rounded-xl text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {selectedResponse.openEnded.improvementSuggestion}
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button 
                onClick={() => setSelectedResponse(null)}
                className="px-5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-semibold text-gray-300 transition-all"
              >
                Close View
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
