import { useState, useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import HomePage from "./HomePage";
import { useAuth } from "./context/AuthContext";
import AdminPage from "./AdminPage.tsx";
import PendingExperiencesPage from "./pages/PendingExperiencesPage.tsx";
import ApprovedExperiencesPage from "./pages/ApprovedExperiencesPage.tsx";
import ManageEventsPage from "./pages/ManageEventsPage.tsx";
import AdminEventsDisplayPage from "./pages/AdminEventsDisplayPage.tsx";
import AccountDetailsPage from "./pages/AccountDetailsPage.tsx";
import PlacementsPage from "./placements/PlacementsPage";
import LoginWrapper from "./Login_Sign/LoginWrapper";
import SignUpPage from "./Login_Sign/SignUpPage";
import ForgotPassword from "./Login_Sign/Forgot_Pass";
import EventsPage from "./pages/EventsPage.tsx";
import RegistrationPage from "./pages/RegistrationPage.tsx";
import ProtectedRoute from "./ProtectedRoute.tsx";
import UnprotectedRoute from "./UnprotectedRoute.tsx";
import ViewEventRegistrationsPage from "./pages/ViewEventRegistrationsPage.tsx";
import AdminViewRegistrationsOverviewPage from "./pages/AdminViewRegistrationsOverviewPage.tsx";
import CartPage from "./pages/CartPage.tsx";
import RegistrationStatusPage from "./pages/RegistrationStatusPage.tsx";
import EnrolledEventsPage from "./pages/EnrolledEventsPage";
import OrganizerPage from "./pages/OrganizerPage";
import UpdateWinnersPage from "./pages/UpdateWinnersPage";
import GalleryPage from "./pages/GalleryPage";
import Header from "./ui/Header";
import AdminHeader from "./ui/AdminHeader";
import OrganizerHeader from "./ui/OrganizerHeader";
import OrganizerProtectedRoute from "./OrganizerProtectedRoute.tsx";

export default function App() {
  const [showIntro, setShowIntro] = useState(sessionStorage.getItem("introSeen") !== "true");
  const [currentLine, setCurrentLine] = useState(0);
  const [text, setText] = useState("");
  const { user } = useAuth();
  const location = useLocation();

  const lines = ["Welcome to CSMIT", "Empowering Future Technocrats..."];

  useEffect(() => {
    if (showIntro && currentLine < lines.length) {
      let i = 0;
      const interval = setInterval(() => {
        setText(lines[currentLine].slice(0, i));
        i++;
        if (i > lines[currentLine].length) {
          clearInterval(interval);
          setTimeout(() => {
            setCurrentLine((prev) => prev + 1);
            setText("");
          }, 800);
        }
      }, 70);
      return () => clearInterval(interval);
    }

    if (currentLine >= lines.length && showIntro) {
      const timeout = setTimeout(() => {
        setShowIntro(false);
        sessionStorage.setItem("introSeen", "true");
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [showIntro, currentLine]);

  // Render header dynamically
  const renderHeader = () => {
    const path = location.pathname;
    if (user?.role === "admin") {
      return <AdminHeader />;
    }
    if (user?.role === "organizer" && path.startsWith("/organizer")) {
      return <OrganizerHeader />;
    }
    return <Header setIsLoginModalOpen={() => {}} setIsSignUpModalOpen={() => {}} />;
  };

  if (showIntro) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center relative overflow-hidden">
        {/* Subtle background grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1a1a1a_1px,transparent_1px)] [background-size:35px_35px] opacity-40"></div>

        <div className="relative z-10 bg-black/80 border border-purple-500/40 rounded-lg shadow-lg shadow-purple-500/20 p-8 font-mono text-purple-400 text-lg max-w-2xl w-[90%] flex flex-col items-center">
          {/* Loader (Purple Glowing Dots) */}
          <div className="flex space-x-3 mb-6">
            <span className="w-3 h-3 bg-purple-500 rounded-full animate-bounce shadow-[0_0_8px_2px_rgba(168,85,247,0.7)] [animation-delay:-0.3s]"></span>
            <span className="w-3 h-3 bg-purple-400 rounded-full animate-bounce shadow-[0_0_8px_2px_rgba(192,132,252,0.7)] [animation-delay:-0.15s]"></span>
            <span className="w-3 h-3 bg-purple-300 rounded-full animate-bounce shadow-[0_0_8px_2px_rgba(216,180,254,0.7)]"></span>
          </div>

          {/* Typewriter Text */}
          <div className="text-center">
            {lines.slice(0, currentLine).map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
            {currentLine < lines.length && (
              <p>
                {text}
                <span className="animate-pulse">_</span>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {renderHeader()}
      <Routes>
        {/* Admin routes (protected) */}
        <Route element={<ProtectedRoute role={["admin"]} />}>
          <Route path="/admin" element={<AdminPage />}>
            <Route index element={<Navigate to="manage-events" replace />} />
            <Route path="manage-events" element={<ManageEventsPage />} />
            <Route path="pending-experiences" element={<PendingExperiencesPage />} />
            <Route path="approved-experiences" element={<ApprovedExperiencesPage />} />
            <Route path="events-display" element={<AdminEventsDisplayPage />} />
            <Route path="account-details" element={<AccountDetailsPage />} />
            <Route path="view-registrations" element={<AdminViewRegistrationsOverviewPage />} />
            <Route path="events/registrations/:eventId" element={<ViewEventRegistrationsPage />} />
            <Route path="registration-status" element={<RegistrationStatusPage />} />
            <Route path="update-winners" element={<UpdateWinnersPage />} />
          </Route>
        </Route>

        {/* Organizer routes (protected) */}
        <Route element={<OrganizerProtectedRoute />}>
          <Route path="/organizer" element={<OrganizerPage />}>
            <Route index element={<Navigate to="registrations/view" replace />} />
            <Route path="registrations/view" element={<AdminViewRegistrationsOverviewPage />} />
            <Route path="events/registrations/:eventId" element={<ViewEventRegistrationsPage />} />
            <Route path="registration-status" element={<RegistrationStatusPage />} />
            <Route path="update-winners" element={<UpdateWinnersPage />} />
          </Route>
        </Route>

        {/* Placements page (public) */}
        <Route path="/placements" element={<PlacementsPage />} />

        {/* Auth routes (only accessible if not logged in) */}
        <Route element={<UnprotectedRoute />}>
          <Route path="/login" element={<LoginWrapper />} />
          <Route
            path="/signup"
            element={<SignUpPage isOpen={false} onClose={() => {}} onSwitchToLogin={() => {}} />}
          />
          <Route
            path="/forgot-password"
            element={<ForgotPassword isOpen={false} onClose={() => {}} onSwitchToLogin={() => {}} />}
          />
        </Route>

        {/* Public pages */}
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/gallery" element={<GalleryPage />} />

        {/* Logged-in user routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/registration" element={<RegistrationPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/enrolled-events" element={<EnrolledEventsPage />} />
        </Route>

        {/* Catch-all route for unmatched paths */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
