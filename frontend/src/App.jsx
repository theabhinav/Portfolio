import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { 
  SurveyProvider, 
  ConsentStep, 
  DemographicsStep, 
  AiResponseStep, 
  QuestionnaireStep, 
  ThanksStep, 
  RequireConsent, 
  RequireDemographics, 
  RequireAiResponse, 
  RequireThanks 
} from './components/SurveyWizard';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import BackgroundCanvas from './components/BackgroundCanvas';
import LoadingScreen from './components/LoadingScreen';

// Admin dashboard route guard
function RequireAdmin({ children }) {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

// Redirect if already logged in
function RedirectIfLoggedIn({ children }) {
  const token = localStorage.getItem('admin_token');
  if (token) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
}

function App() {
  const [loading, setLoading] = useState(true);

  return (
    <>
      {loading && <LoadingScreen onFinish={() => setLoading(false)} />}
      
      {!loading && (
        <Router>
          {/* Subtle neural canvas background */}
          <BackgroundCanvas />
          
          <SurveyProvider>
            <div className="min-h-screen relative flex items-center justify-center p-4">
              <Routes>
                {/* Participant Survey routes */}
                <Route path="/" element={<ConsentStep />} />
                <Route 
                  path="/demographics" 
                  element={
                    <RequireConsent>
                      <DemographicsStep />
                    </RequireConsent>
                  } 
                />
                <Route 
                  path="/ai-response" 
                  element={
                    <RequireDemographics>
                      <AiResponseStep />
                    </RequireDemographics>
                  } 
                />
                <Route 
                  path="/questionnaire" 
                  element={
                    <RequireAiResponse>
                      <QuestionnaireStep />
                    </RequireAiResponse>
                  } 
                />
                <Route 
                  path="/thanks" 
                  element={
                    <RequireThanks>
                      <ThanksStep />
                    </RequireThanks>
                  } 
                />

                {/* Admin Dashboard routes */}
                <Route 
                  path="/admin/login" 
                  element={
                    <RedirectIfLoggedIn>
                      <AdminLogin />
                    </RedirectIfLoggedIn>
                  } 
                />
                <Route 
                  path="/admin/dashboard" 
                  element={
                    <RequireAdmin>
                      <AdminDashboard />
                    </RequireAdmin>
                  } 
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              {/* Subtle Admin Link */}
              <div className="absolute bottom-4 right-4 z-30">
                <Link 
                  to="/admin/login" 
                  className="text-xs text-gray-600 hover:text-[#7c6fff] transition-colors duration-300"
                >
                  Admin Panel
                </Link>
              </div>
            </div>
          </SurveyProvider>
        </Router>
      )}
    </>
  );
}

export default App;
