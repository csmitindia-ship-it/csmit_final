import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../Photos/Logo.png";
import { useAuth } from "../context/AuthContext";
import ThemedModal from "../components/ThemedModal";
import { FiLogIn, FiUserPlus, FiLogOut, FiMenu, FiX } from "react-icons/fi";
import API_BASE_URL from "../Config";

interface HeaderProps {
  setIsLoginModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSignUpModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Header: React.FC<HeaderProps> = ({ setIsLoginModalOpen, setIsSignUpModalOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [symposiumStatus, setSymposiumStatus] = useState<any[]>([]);
  const [isSymposiumModalOpen, setIsSymposiumModalOpen] = useState(false);
  const [enigmaDate, setEnigmaDate] = useState("");
  const [carteblancheDate, setCarteblancheDate] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchSymposiumStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/symposium/status`);
        const data = await response.json();
        if (data.success) {
          setSymposiumStatus(data.data);
        } else {
          console.error("Failed to fetch symposium status:", data.message);
        }
      } catch (error) {
        console.error("Error fetching symposium status:", error);
        setModalTitle("Error");
        setModalMessage("Failed to fetch symposium status.");
        setIsModalOpen(true);
      }
    };
    fetchSymposiumStatus();
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    if (location.pathname !== "/") {
      navigate(`/${targetId}`);
    } else {
      const element = document.getElementById(targetId.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleLogout = () => {
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    logout();
    navigate("/");
  };

  const handleStartSymposium = async (symposiumName: string, date: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/symposium/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symposiumName, startDate: date }),
      });
      if (response && response.ok) {
        setModalTitle("Success");
        setModalMessage(`Successfully started ${symposiumName}.`);
        setIsModalOpen(true);
        const statusResponse = await fetch(`${API_BASE_URL}/symposium/status`);
        const data = await statusResponse.json();
        if (data.success) {
          setSymposiumStatus(data.data);
        }
      } else {
        setModalTitle("Error");
        setModalMessage(`Failed to start ${symposiumName}.`);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error(`Error starting ${symposiumName}:`, error);
      setModalTitle("Error");
      setModalMessage(`Error starting ${symposiumName}.`);
      setIsModalOpen(true);
    }
  };

  const handleStopSymposium = async (symposiumName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/symposium/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symposiumName }),
      });
      if (response && response.ok) {
        setModalTitle("Success");
        setModalMessage(`${symposiumName} has been stopped.`);
        setIsModalOpen(true);
        const statusResponse = await fetch(`${API_BASE_URL}/symposium/status`);
        const data = await statusResponse.json();
        if (data.success) {
          setSymposiumStatus(data.data);
        }
      } else {
        setModalTitle("Error");
        setModalMessage(`Failed to stop ${symposiumName}.`);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error(`Error stopping ${symposiumName}:`, error);
      setModalTitle("Error");
      setModalMessage(`Error stopping ${symposiumName}.`);
      setIsModalOpen(true);
    }
  };

  const getSymposiumStatus = (symposiumName: string) => {
    if (!Array.isArray(symposiumStatus)) return false;
    const symposium = symposiumStatus.find((s) => s.symposiumName === symposiumName);
    return symposium ? symposium.isOpen === 1 : false;
  };

  const navLinks = (
    <>
      {user?.role !== "admin" && (
        <>
          <a href="#home" onClick={(e) => handleNavClick(e, "#home")} className="text-white hover:text-purple-400 transition block py-2 md:py-0">
            Home
          </a>
          <a href="#featured-alumni" onClick={(e) => handleNavClick(e, "#featured-alumni")} className="text-white hover:text-purple-400 transition block py-2 md:py-0">
            Alumni
          </a>
          <a href="#about" onClick={(e) => handleNavClick(e, "#about")} className="text-white hover:text-purple-400 transition block py-2 md:py-0">
            About
          </a>
          <a href="/gallery" onClick={(e) => { e.preventDefault(); navigate("/gallery"); if (isMobileMenuOpen) setIsMobileMenuOpen(false); }} className="text-white hover:text-purple-400 transition block py-2 md:py-0">
            Gallery
          </a>
        </>
      )}
      {user?.role === "admin" ? (
        <a
          href="/admin"
          onClick={(e) => {
            e.preventDefault();
            navigate("/admin");
            if (isMobileMenuOpen) setIsMobileMenuOpen(false);
          }}
          className="text-white hover:text-purple-400 transition block py-2 md:py-0"
        >
          Managements
        </a>
      ) : (
        <a href="#events" onClick={(e) => handleNavClick(e, "#events")} className="text-white hover:text-purple-400 transition block py-2 md:py-0">
          Events
        </a>
      )}
      <a
        href="/placements"
        onClick={(e) => {
          e.preventDefault();
          navigate("/placements");
          if (isMobileMenuOpen) setIsMobileMenuOpen(false);
        }}
        className="text-white hover:text-purple-400 transition block py-2 md:py-0"
      >
        Placements
      </a>
      {user?.role === "admin" && (
        <a
          href="/admin/organizer"
          onClick={(e) => {
            e.preventDefault();
            navigate("/admin/organizer");
            if (isMobileMenuOpen) setIsMobileMenuOpen(false);
          }}
          className="text-white hover:text-purple-400 transition block py-2 md:py-0"
        >
          Organizer
        </a>
      )}
      {user?.role === "admin" && (
        <>
          <button onClick={() => { setIsSymposiumModalOpen(true); if (isMobileMenuOpen) setIsMobileMenuOpen(false); }} className="text-white hover:text-purple-400 transition block py-2 md:py-0 text-left">
            Symposium Control
          </button>
        </>
      )}
      {user && user.role !== "admin" && (
        <a
          href="/enrolled-events"
          onClick={(e) => {
            e.preventDefault();
            navigate("/enrolled-events");
            if (isMobileMenuOpen) setIsMobileMenuOpen(false);
          }}
          className="text-white hover:text-purple-400 transition block py-2 md:py-0"
        >
          My Events
        </a>
      )}
      {user && user.role !== "admin" && (
        <a
          href="/cart"
          onClick={(e) => {
            e.preventDefault();
            navigate("/cart");
            if (isMobileMenuOpen) setIsMobileMenuOpen(false);
          }}
          className="text-white hover:text-purple-400 transition block py-2 md:py-0"
        >
          Cart
        </a>
      )}
      {user && (
        <a
          href="/accommodation"
          onClick={(e) => {
            e.preventDefault();
            navigate("/accommodation");
            if (isMobileMenuOpen) setIsMobileMenuOpen(false);
          }}
          className="text-white hover:text-purple-400 transition block py-2 md:py-0"
        >
          Accommodation
        </a>
      )}
    </>
  );

  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-900 z-30 shadow-lg">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo + Title */}
        <div className="flex items-center space-x-3">
          <img src={Logo} alt="CSMIT Logo" className="h-10 w-auto rounded-md" />
          <span className="text-2xl font-bold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
            CSMIT
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          {navLinks}
        </div>

        {/* Login / Signup / User Info */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              <button
                onClick={() => {
                  if (user.role === "admin") {
                    navigate("/admin");
                  } else if (user.role === "student") {
                    navigate("/student-dashboard");
                  } else if (user.role === "organizer") {
                    navigate("/admin/view-registrations");
                  }
                  if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                }}
                className="px-4 py-2 text-sm border border-purple-400 text-purple-400 rounded-md hover:bg-purple-400 hover:text-black transition"
              >
                {user.role === "admin" ? "Admin" : user.name || user.email}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
              >
                <FiLogOut className="mr-2" />
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setIsLoginModalOpen(true); if (isMobileMenuOpen) setIsMobileMenuOpen(false); }}
                className="flex items-center px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
              >
                <FiLogIn className="mr-2" />
                Login
              </button>
              <button
                onClick={() => { setIsSignUpModalOpen(true); if (isMobileMenuOpen) setIsMobileMenuOpen(false); }}
                className="flex items-center px-4 py-2 text-sm border border-purple-400 text-purple-400 rounded-md hover:bg-purple-400 hover:text-black transition"
              >
                <FiUserPlus className="mr-2" />
                Sign Up
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-900 px-6 pb-4">
          <div className="flex flex-col space-y-4">
            {navLinks}
            <div className="border-t border-gray-700 pt-4 flex flex-col space-y-4">
              {user ? (
                <>
                  <button
                    onClick={() => {
                      if (user.role === "admin") {
                        navigate("/admin");
                      } else if (user.role === "student") {
                        navigate("/student-dashboard");
                      } else if (user.role === "organizer") {
                        navigate("/admin/view-registrations");
                      }
                      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                    }}
                    className="px-4 py-2 text-sm border border-purple-400 text-purple-400 rounded-md hover:bg-purple-400 hover:text-black transition text-left"
                  >
                    {user.role === "admin" ? "Admin" : user.name || user.email}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                  >
                    <FiLogOut className="mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setIsLoginModalOpen(true); if (isMobileMenuOpen) setIsMobileMenuOpen(false); }}
                    className="flex items-center px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
                  >
                    <FiLogIn className="mr-2" />
                    Login
                  </button>
                  <button
                    onClick={() => { setIsSignUpModalOpen(true); if (isMobileMenuOpen) setIsMobileMenuOpen(false); }}
                    className="flex items-center px-4 py-2 text-sm border border-purple-400 text-purple-400 rounded-md hover:bg-purple-400 hover:text-black transition"
                  >
                    <FiUserPlus className="mr-2" />
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Symposium Control Modal */}
      <ThemedModal
        isOpen={isSymposiumModalOpen}
        onClose={() => setIsSymposiumModalOpen(false)}
        title="Symposium Control"
        hideDefaultFooter={true}
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white">Enigma</h3>
            {getSymposiumStatus("Enigma") ? (
              <button
                onClick={() => handleStopSymposium("Enigma")}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
              >
                Stop
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  className="bg-gray-700 p-1 rounded-md text-white"
                  value={enigmaDate}
                  onChange={(e) => setEnigmaDate(e.target.value)}
                />
                <button
                  onClick={() => handleStartSymposium("Enigma", enigmaDate)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
                >
                  Start
                </button>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Carteblanche</h3>
            {getSymposiumStatus("Carteblanche") ? (
              <button
                onClick={() => handleStopSymposium("Carteblanche")}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
              >
                Stop
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  className="bg-gray-700 p-1 rounded-md text-white"
                  value={carteblancheDate}
                  onChange={(e) => setCarteblancheDate(e.target.value)}
                />
                <button
                  onClick={() => handleStartSymposium("Carteblanche", carteblancheDate)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
                >
                  Start
                </button>
              </div>
            )}
          </div>
        </div>
      </ThemedModal>

      {/* ✅ Global Modal for Alerts */}
      <ThemedModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        <p className="text-white">{modalMessage}</p>
      </ThemedModal>
    </header>
  );
};

export default Header;