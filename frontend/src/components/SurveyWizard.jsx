import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  CheckCircle, ArrowRight, Clipboard, Award, Shield, 
  User, Sparkles, BrainCircuit, PenTool, HelpCircle, AlertCircle
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

// Create Survey Context
const SurveyContext = createContext(null);

export function SurveyProvider({ children }) {
  const [consentGiven, setConsentGiven] = useState(false);
  const [demographics, setDemographics] = useState({
    age: '',
    gender: '',
    grade: '',
    stream: '',
    familyCareerLeaning: ''
  });
  const [participantId, setParticipantId] = useState('');
  const [aiVersion, setAiVersion] = useState('');
  const [mcq, setMcq] = useState({
    careerChoice: '',
    confidence: 0,
    wouldVerify: '',
    aiInfluence: 0,
    helpedThinkCarefully: ''
  });
  const [openEnded, setOpenEnded] = useState({
    whyChoice: '',
    influentialPart: '',
    unhelpfulOrMisleading: '',
    improvementSuggestion: ''
  });
  const [submitted, setSubmitted] = useState(false);

  // Reset Survey State
  const resetSurvey = () => {
    setConsentGiven(false);
    setDemographics({
      age: '',
      gender: '',
      grade: '',
      stream: '',
      familyCareerLeaning: ''
    });
    setParticipantId('');
    setAiVersion('');
    setMcq({
      careerChoice: '',
      confidence: 0,
      wouldVerify: '',
      aiInfluence: 0,
      helpedThinkCarefully: ''
    });
    setOpenEnded({
      whyChoice: '',
      influentialPart: '',
      unhelpfulOrMisleading: '',
      improvementSuggestion: ''
    });
    setSubmitted(false);
  };

  return (
    <SurveyContext.Provider value={{
      consentGiven, setConsentGiven,
      demographics, setDemographics,
      participantId, setParticipantId,
      aiVersion, setAiVersion,
      mcq, setMcq,
      openEnded, setOpenEnded,
      submitted, setSubmitted,
      resetSurvey
    }}>
      {children}
    </SurveyContext.Provider>
  );
}

export const useSurvey = () => useContext(SurveyContext);

// --- Route Guards ---

export function RequireConsent({ children }) {
  const { consentGiven } = useSurvey();
  if (!consentGiven) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export function RequireDemographics({ children }) {
  const { consentGiven, demographics } = useSurvey();
  const hasDemographics = demographics.age && demographics.gender && demographics.grade && demographics.stream && demographics.familyCareerLeaning;
  if (!consentGiven) return <Navigate to="/" replace />;
  if (!hasDemographics) return <Navigate to="/demographics" replace />;
  return children;
}

export function RequireAiResponse({ children }) {
  const { consentGiven, demographics, participantId, aiVersion } = useSurvey();
  const hasDemographics = demographics.age && demographics.gender && demographics.grade && demographics.stream && demographics.familyCareerLeaning;
  if (!consentGiven) return <Navigate to="/" replace />;
  if (!hasDemographics) return <Navigate to="/demographics" replace />;
  if (!participantId || !aiVersion) return <Navigate to="/demographics" replace />;
  return children;
}

export function RequireThanks({ children }) {
  const { submitted } = useSurvey();
  if (!submitted) {
    return <Navigate to="/" replace />;
  }
  return children;
}


// --- Step 1: Info & Consent ---
export function ConsentStep() {
  const { consentGiven, setConsentGiven } = useSurvey();
  const navigate = useNavigate();

  const handleContinue = () => {
    if (consentGiven) {
      navigate('/demographics');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="max-w-2xl mx-auto glass-panel-glow glass-panel rounded-2xl p-8 md:p-10 relative z-20"
    >
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-[#7c6fff]">
          <Shield size={36} />
        </div>
      </div>

      <h1 className="text-3xl font-bold text-center mb-2 font-heading bg-gradient-to-r from-white via-indigo-200 to-[#4fd1ff] bg-clip-text text-transparent">
        Research Study & Consent
      </h1>
      <p className="text-sm text-gray-400 text-center mb-8 font-mono">
        Independent Study: AI-Assisted Career Decision-Making
      </p>

      <div className="space-y-4 text-sm text-gray-300 bg-black/30 border border-white/5 rounded-xl p-6 max-h-72 overflow-y-auto leading-relaxed mb-6">
        <p className="font-bold text-white mb-2">Purpose of the Study:</p>
        <p>
          You are invited to participate in a research study exploring the efficacy and influence of different types of artificial intelligence (AI) advice styles on career selection processes in students.
        </p>
        <p>
          Your participation is completely voluntary. You are free to withdraw at any point before submitting your response.
        </p>
        <p className="font-bold text-white mb-2">Anonymity & Data Collection:</p>
        <p>
          This study is **100% anonymous**. We do **NOT** collect names, email addresses, IP addresses, or any Personally Identifiable Information (PII). All responses will be securely stored in our database and analyzed in aggregate.
        </p>
        <p className="font-bold text-white mb-2">What you will do:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Submit basic, anonymous demographics (age, grade/class, study stream).</li>
          <li>Review a career dilemma scenario and read the generated advice from an AI engine.</li>
          <li>Complete a brief evaluation questionnaire comprising 5 MCQs and 4 short open-ended questions.</li>
        </ul>
        <p>
          By checking the box below, you confirm that you have read this form, understand your participation is anonymous, and voluntarily agree to participate.
        </p>
      </div>

      <div className="flex items-center space-x-3 mb-8 bg-white/5 p-4 rounded-xl border border-white/5">
        <input 
          type="checkbox" 
          id="consent"
          checked={consentGiven}
          onChange={(e) => setConsentGiven(e.target.checked)}
          className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />
        <label htmlFor="consent" className="text-sm text-gray-200 cursor-pointer select-none">
          I consent to participate in this study.
        </label>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!consentGiven}
          className="btn flex items-center gap-2 px-6 py-3 rounded-xl font-heading text-sm font-semibold transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed bg-gradient-to-r from-[#7c6fff] to-[#4fd1ff] text-black shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0"
        >
          Begin Study <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}


// --- Step 2: Demographics ---
export function DemographicsStep() {
  const { demographics, setDemographics, setParticipantId, setAiVersion } = useSurvey();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleTileSelect = (field, value) => {
    console.log(`Setting demographic tile [${field}] =`, value);
    setDemographics(prev => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input change [${name}] =`, value);
    setDemographics(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = 
    demographics.age && 
    demographics.gender && 
    demographics.grade && 
    demographics.stream && 
    demographics.familyCareerLeaning;

  const handleNext = async () => {
    if (!isFormValid) return;
    setLoading(true);
    setError('');

    try {
      // Start participant session - fetch randomized AI Version & unique ID with 4s timeout
      const response = await axios.get(`${API_BASE_URL}/participant/start`, { timeout: 4000 });
      const { participantId, aiVersion } = response.data;
      
      setParticipantId(participantId);
      setAiVersion(aiVersion);
      
      navigate('/ai-response');
    } catch (err) {
      console.error(err);
      setError('Failed to connect to the database server. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="w-full max-w-2xl mx-auto glass-panel rounded-2xl p-8 md:p-10 relative z-20"
    >
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-[#7c6fff]">
          <User size={36} />
        </div>
      </div>

      <h1 className="text-3xl font-bold text-center mb-2 font-heading bg-gradient-to-r from-white via-indigo-200 to-[#4fd1ff] bg-clip-text text-transparent">
        Demographics
      </h1>
      <p className="text-sm text-gray-400 text-center mb-8 font-mono">
        All entries are anonymous and used for research grouping.
      </p>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Age */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2 font-heading">Age</label>
          <input 
            type="number" 
            name="age" 
            min="10" 
            max="100"
            value={demographics.age || ''}
            onChange={handleInputChange}
            placeholder="Enter age (e.g. 17)"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#7c6fff] focus:ring-1 focus:ring-[#7c6fff] transition-all"
          />
        </div>

        {/* Gender Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2 font-heading">Gender</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => handleTileSelect('gender', g)}
                className={`py-3 rounded-xl border text-xs font-semibold tracking-wide cursor-pointer transition-all ${
                  demographics.gender === g 
                    ? 'bg-gradient-to-r from-[#7c6fff]/20 to-[#4fd1ff]/20 border-[#7c6fff] text-white shadow-[0_0_15px_rgba(124,111,255,0.15)]' 
                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Grade/Class */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2 font-heading">Grade / Class</label>
          <input 
            type="text" 
            name="grade" 
            value={demographics.grade || ''}
            onChange={handleInputChange}
            placeholder="e.g. Class 11th"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#7c6fff] focus:ring-1 focus:ring-[#7c6fff] transition-all"
          />
        </div>

        {/* Academic Stream */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2 font-heading">Academic Stream / Subjects</label>
          <input 
            type="text" 
            name="stream" 
            value={demographics.stream || ''}
            onChange={handleInputChange}
            placeholder="e.g. Science (PCM/B), Commerce, Humanities"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#7c6fff] focus:ring-1 focus:ring-[#7c6fff] transition-all"
          />
        </div>

        {/* Family Career Leaning */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2 font-heading">Which career field does your family lean towards or support?</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { key: 'computer_science', label: 'Computer Science' },
              { key: 'medicine', label: 'Medicine' },
              { key: 'both_supportive', label: 'Supportive of both' },
              { key: 'neither', label: 'Neither / Neutral' },
              { key: 'not_applicable', label: 'Not Applicable' }
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleTileSelect('familyCareerLeaning', opt.key)}
                className={`px-4 py-3 rounded-xl border text-left text-xs font-semibold tracking-wide cursor-pointer transition-all ${
                  demographics.familyCareerLeaning === opt.key 
                    ? 'bg-gradient-to-r from-[#7c6fff]/20 to-[#4fd1ff]/20 border-[#7c6fff] text-white shadow-[0_0_15px_rgba(124,111,255,0.15)]' 
                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-10">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-xl font-heading text-sm font-semibold border border-white/10 text-gray-300 hover:bg-white/5 transition-all cursor-pointer"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!isFormValid || loading}
          className="btn flex items-center gap-2 px-6 py-3 rounded-xl font-heading text-sm font-semibold transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed bg-gradient-to-r from-[#7c6fff] to-[#4fd1ff] text-black shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          {loading ? 'Initializing...' : 'Continue'} <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}


// --- Step 3: AI Response ---
export function AiResponseStep() {
  const { aiVersion } = useSurvey();
  const navigate = useNavigate();

  const AI_TEXTS = {
    direct: "I strongly recommend you choose Computer Science. It perfectly leverages your talent for Mathematics, matches your parents' supportive stance, and opens immediate pathways to stable, high-paying career opportunities with a 4-year degree.",
    brief: "Computer Science offers high-paying job opportunities, flexibility (remote work), and leverages your mathematical skills. Medicine offers long-term stability and directly utilizes biology, but requires a massive time investment (7-10+ years). Given your overlapping interests, I suggest Bioinformatics: it integrates biology, math, and programming perfectly, satisfying both your passions and your parents' supportive options.",
    detailed: "Choosing a career when you enjoy Math, Computer Science, and Biology presents a unique set of paths. Here is a balanced evaluation:\n\n• Computer Science & Math: This path offers rapid entry into the job market (4-year degree), excellent compensation, and remote flexibility. It applies logical thinking and programming.\n• Medicine & Biology: This path offers a deep sense of medical purpose, lifetime stability, and direct human impact. However, it requires a minimum of 7-10 years of residency/study and high stress.\n\nTo make an informed decision, ask yourself these core questions:\n1. Are you prepared for a decade-long training lifecycle (Medicine), or would you prefer entering the tech workforce in 4 years (CS)?\n2. Do you prefer working on computational models and abstract coding, or are you driven by patient care and live biology?\n3. Would a hybrid pathway like Computational Biology or Medical Software Engineering satisfy both your parents and your own personal interests?"
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="max-w-2xl mx-auto glass-panel rounded-2xl p-8 md:p-10 relative z-20"
    >
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-[#7c6fff]">
          <BrainCircuit size={36} />
        </div>
      </div>

      <h1 className="text-3xl font-bold text-center mb-2 font-heading bg-gradient-to-r from-white via-indigo-200 to-[#4fd1ff] bg-clip-text text-transparent">
        AI Career Advice
      </h1>
      <p className="text-sm text-gray-400 text-center mb-8 font-mono">
        Read the student scenario and the advice provided by the AI.
      </p>

      {/* Scenario Container */}
      <div className="mb-8 p-5 bg-indigo-950/20 border-l-4 border-[#7c6fff] rounded-r-xl">
        <span className="block text-xs uppercase tracking-widest font-mono text-[#7c6fff] mb-2">Assumed Scenario</span>
        <p className="text-sm text-gray-300 italic">
          "Suppose you're a student of class 11th, enjoy mathematics and computer science, also like Biology, want a stable and meaningful career, parents are supportive of either Computer Science or Medicine, unsure of which path to choose and take help of the AI."
        </p>
      </div>

      {/* AI Advice Output */}
      <div className="relative mb-8 p-6 md:p-8 bg-white/5 border border-cyan-500/20 rounded-2xl shadow-[0_0_20px_rgba(79,209,255,0.05)]">
        <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold font-heading mb-4">
          <Sparkles size={16} />
          <span>AI response ({aiVersion})</span>
        </div>
        <p className="text-white text-base leading-relaxed whitespace-pre-wrap">
          {AI_TEXTS[aiVersion] || 'No advice found.'}
        </p>
      </div>

      <div className="flex justify-between mt-10">
        <button
          onClick={() => navigate('/demographics')}
          className="px-6 py-3 rounded-xl font-heading text-sm font-semibold border border-white/10 text-gray-300 hover:bg-white/5 transition-all cursor-pointer"
        >
          Back
        </button>
        <button
          onClick={() => navigate('/questionnaire')}
          className="btn flex items-center gap-2 px-6 py-3 rounded-xl font-heading text-sm font-semibold transition-all duration-300 bg-gradient-to-r from-[#7c6fff] to-[#4fd1ff] text-black shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          Proceed to Questionnaire <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}


// --- Step 4: Questionnaire & Submission ---
export function QuestionnaireStep() {
  const { demographics, participantId, aiVersion, mcq, setMcq, openEnded, setOpenEnded, setSubmitted } = useSurvey();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getWordCount = (text) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const isWordCountValid = (text) => {
    if (!text || text.trim() === '') return true; // Optional: 0 words is valid
    const count = getWordCount(text);
    return count <= 150; // Max 150 words limit
  };

  // Helper validation status
  const isMcqValid = 
    mcq.careerChoice &&
    mcq.confidence > 0 &&
    mcq.wouldVerify &&
    mcq.aiInfluence > 0 &&
    mcq.helpedThinkCarefully;

  const isOpenEndedValid = 
    isWordCountValid(openEnded.whyChoice) &&
    isWordCountValid(openEnded.influentialPart) &&
    isWordCountValid(openEnded.unhelpfulOrMisleading) &&
    isWordCountValid(openEnded.improvementSuggestion);

  const isFormComplete = isMcqValid && isOpenEndedValid;

  const handleMcqSelect = (field, value) => {
    console.log(`Setting MCQ [${field}] =`, value);
    setMcq(prev => ({ ...prev, [field]: value }));
  };

  const handleOpenEndedChange = (e) => {
    const { name, value } = e.target;
    setOpenEnded(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitSurvey = async () => {
    if (!isFormComplete) return;
    setLoading(true);
    setError('');

    try {
      const payload = {
        participantId,
        consentGiven: true,
        demographics: {
          age: parseInt(demographics.age),
          gender: demographics.gender,
          grade: demographics.grade,
          stream: demographics.stream,
          familyCareerLeaning: demographics.familyCareerLeaning
        },
        aiVersion,
        mcq,
        openEnded
      };

      // Submit responses with 8s timeout
      const response = await axios.post(`${API_BASE_URL}/participant/submit`, payload, { timeout: 8000 });
      if (response.data.success) {
        setSubmitted(true);
        navigate('/thanks');
      } else {
        setError(response.data.error || 'Failed to submit survey.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Connection failed. Please check if your server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="w-full max-w-3xl mx-auto glass-panel rounded-2xl p-8 md:p-10 mb-10 relative z-20"
    >
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-[#7c6fff]">
          <PenTool size={36} />
        </div>
      </div>

      <h1 className="text-3xl font-bold text-center mb-2 font-heading bg-gradient-to-r from-white via-indigo-200 to-[#4fd1ff] bg-clip-text text-transparent">
        Evaluation Questionnaire
      </h1>
      <p className="text-sm text-gray-400 text-center mb-8 font-mono">
        Please complete all questions to enable survey submission.
      </p>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* MCQ SECTION */}
      <div className="mb-10 space-y-6">
        <h3 className="text-lg font-bold text-[#4fd1ff] border-b border-white/5 pb-2 font-heading flex items-center gap-2">
          <HelpCircle size={18} />
          <span>Part 1: Choice & Evaluation</span>
        </h3>

        {/* Q1 */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            1. Based on the AI's advice, which career would you choose?
          </label>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'computer_science', label: 'Computer Science' },
              { key: 'medicine', label: 'Medicine' }
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleMcqSelect('careerChoice', opt.key)}
                className={`py-3 rounded-xl border font-semibold tracking-wide cursor-pointer transition-all ${
                  mcq.careerChoice === opt.key 
                    ? 'bg-gradient-to-r from-[#7c6fff]/20 to-[#4fd1ff]/20 border-[#7c6fff] text-white shadow-[0_0_15px_rgba(124,111,255,0.15)]' 
                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Q2 */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            2. How confident are you in this decision?
          </label>
          <div className="flex justify-between gap-2">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleMcqSelect('confidence', val)}
                className={`flex-1 py-3 rounded-xl border font-bold text-center cursor-pointer transition-all ${
                  mcq.confidence === val 
                    ? 'bg-gradient-to-r from-[#7c6fff] to-[#4fd1ff] border-transparent text-black shadow-[0_0_15px_rgba(124,111,255,0.3)]' 
                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1 px-1 font-mono">
            <span>Not Confident</span>
            <span>Highly Confident</span>
          </div>
        </div>

        {/* Q3 */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            3. Would you verify this advice from another source?
          </label>
          <div className="grid grid-cols-2 gap-4">
            {['Yes', 'No'].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleMcqSelect('wouldVerify', opt)}
                className={`py-3 rounded-xl border font-semibold tracking-wide cursor-pointer transition-all ${
                  mcq.wouldVerify === opt 
                    ? 'bg-gradient-to-r from-[#7c6fff]/20 to-[#4fd1ff]/20 border-[#7c6fff] text-white shadow-[0_0_15px_rgba(124,111,255,0.15)]' 
                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Q4 */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            4. How much did this version of AI influence your decision?
          </label>
          <div className="flex justify-between gap-2">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleMcqSelect('aiInfluence', val)}
                className={`flex-1 py-3 rounded-xl border font-bold text-center cursor-pointer transition-all ${
                  mcq.aiInfluence === val 
                    ? 'bg-gradient-to-r from-[#7c6fff] to-[#4fd1ff] border-transparent text-black shadow-[0_0_15px_rgba(124,111,255,0.3)]' 
                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1 px-1 font-mono">
            <span>No Influence</span>
            <span>Strongly Influenced</span>
          </div>
        </div>

        {/* Q5 */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            5. Did this version of AI help you think more carefully?
          </label>
          <div className="grid grid-cols-2 gap-4">
            {['Yes', 'No'].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleMcqSelect('helpedThinkCarefully', opt)}
                className={`py-3 rounded-xl border font-semibold tracking-wide cursor-pointer transition-all ${
                  mcq.helpedThinkCarefully === opt 
                    ? 'bg-gradient-to-r from-[#7c6fff]/20 to-[#4fd1ff]/20 border-[#7c6fff] text-white shadow-[0_0_15px_rgba(124,111,255,0.15)]' 
                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* OPEN ENDED SECTION */}
      <div className="space-y-6 mt-10">
        <h3 className="text-lg font-bold text-[#4fd1ff] border-b border-white/5 pb-2 font-heading flex items-center gap-2">
          <PenTool size={18} />
          <span>Part 2: Open-Ended Feedback</span>
        </h3>
        <p className="text-xs text-gray-400 italic">
          These questions are optional (maximum 150 words each). The counter turns red if you exceed the limit.
        </p>

        {/* Open Q1 */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">1. Why did you make your choice? (Optional)</label>
          <textarea
            name="whyChoice"
            rows="3"
            value={openEnded.whyChoice || ''}
            onChange={handleOpenEndedChange}
            placeholder="Describe the logic and constraints that pushed you towards Computer Science or Medicine..."
            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#7c6fff] focus:ring-1 focus:ring-[#7c6fff] transition-all font-body text-sm"
          />
          <div className="flex justify-end mt-1">
            <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
              !openEnded.whyChoice || openEnded.whyChoice.trim() === ''
                ? 'bg-white/5 text-gray-400 border-white/5'
                : isWordCountValid(openEnded.whyChoice)
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {getWordCount(openEnded.whyChoice)} / 150 words
            </span>
          </div>
        </div>

        {/* Open Q2 */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">2. Which part of the AI's response influenced your decision? (Optional)</label>
          <textarea
            name="influentialPart"
            rows="3"
            value={openEnded.influentialPart || ''}
            onChange={handleOpenEndedChange}
            placeholder="Refer to specific arguments, options, timelines, or questions raised by the AI..."
            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#7c6fff] focus:ring-1 focus:ring-[#7c6fff] transition-all font-body text-sm"
          />
          <div className="flex justify-end mt-1">
            <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
              !openEnded.influentialPart || openEnded.influentialPart.trim() === ''
                ? 'bg-white/5 text-gray-400 border-white/5'
                : isWordCountValid(openEnded.influentialPart)
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {getWordCount(openEnded.influentialPart)} / 150 words
            </span>
          </div>
        </div>

        {/* Open Q3 */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">3. Was there anything you found unhelpful or misleading? (Optional)</label>
          <textarea
            name="unhelpfulOrMisleading"
            rows="3"
            value={openEnded.unhelpfulOrMisleading || ''}
            onChange={handleOpenEndedChange}
            placeholder="Explain if any argument was biased, oversimplified, or omitted important facts..."
            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#7c6fff] focus:ring-1 focus:ring-[#7c6fff] transition-all font-body text-sm"
          />
          <div className="flex justify-end mt-1">
            <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
              !openEnded.unhelpfulOrMisleading || openEnded.unhelpfulOrMisleading.trim() === ''
                ? 'bg-white/5 text-gray-400 border-white/5'
                : isWordCountValid(openEnded.unhelpfulOrMisleading)
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {getWordCount(openEnded.unhelpfulOrMisleading)} / 150 words
            </span>
          </div>
        </div>

        {/* Open Q4 */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">4. If you could improve the AI's advice, what would you change? (Optional)</label>
          <textarea
            name="improvementSuggestion"
            rows="3"
            value={openEnded.improvementSuggestion || ''}
            onChange={handleOpenEndedChange}
            placeholder="Describe what additional info, layout layout improvements, or perspectives the AI should have included..."
            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#7c6fff] focus:ring-1 focus:ring-[#7c6fff] transition-all font-body text-sm"
          />
          <div className="flex justify-end mt-1">
            <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
              !openEnded.improvementSuggestion || openEnded.improvementSuggestion.trim() === ''
                ? 'bg-white/5 text-gray-400 border-white/5'
                : isWordCountValid(openEnded.improvementSuggestion)
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {getWordCount(openEnded.improvementSuggestion)} / 150 words
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-between mt-10">
        <button
          onClick={() => navigate('/ai-response')}
          className="px-6 py-3 rounded-xl font-heading text-sm font-semibold border border-white/10 text-gray-300 hover:bg-white/5 transition-all cursor-pointer"
        >
          Back
        </button>
        <button
          onClick={handleSubmitSurvey}
          disabled={!isFormComplete || loading}
          className="btn flex items-center gap-2 px-6 py-3 rounded-xl font-heading text-sm font-semibold transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed bg-gradient-to-r from-[#7c6fff] to-[#4fd1ff] text-black shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          {loading ? 'Submitting Responses...' : 'Submit Survey'} <CheckCircle size={16} />
        </button>
      </div>
    </motion.div>
  );
}


// --- Step 5: Success & Thanks ---
export function ThanksStep() {
  const { resetSurvey } = useSurvey();
  const navigate = useNavigate();

  const handleRestart = () => {
    resetSurvey();
    navigate('/');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-md mx-auto glass-panel-glow glass-panel rounded-2xl p-10 text-center relative z-20"
    >
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-[#10b981]">
          <Clipboard size={36} />
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-2 font-heading bg-gradient-to-r from-white via-emerald-200 to-[#4fd1ff] bg-clip-text text-transparent">
        Thank You!
      </h1>
      <p className="text-sm text-gray-400 mb-8 font-mono">
        Your response has been stored.
      </p>

      <p className="text-gray-300 text-sm leading-relaxed mb-8">
        Your submission was received successfully and stored completely anonymously. The data will be used to analyze decision-making patterns in high school students.
      </p>

      <button
        onClick={handleRestart}
        className="btn px-6 py-3 rounded-xl font-heading text-sm font-semibold transition-all duration-300 bg-gradient-to-r from-[#7c6fff] to-[#4fd1ff] text-black shadow-lg shadow-indigo-500/20 hover:shadow-[#7c6fff]/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
      >
        Submit Another Response
      </button>
    </motion.div>
  );
}
