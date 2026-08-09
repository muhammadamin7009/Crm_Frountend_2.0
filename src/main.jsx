import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ToastContainer } from "react-toastify";

// Router
import { BrowserRouter as Router } from "react-router-dom";

// Styles
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import { AuthProvider } from "./Context/AuthContext.jsx";
import { ThemeModeProvider } from "./Context/ThemeContext.jsx";
import ErrorBoundary from "./Components/ErrorBoundary/ErrorBoundary.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeModeProvider>
        <AuthProvider>
          <App />
          <ToastContainer theme="colored" />
        </AuthProvider>
      </ThemeModeProvider>
    </Router>
  </ErrorBoundary>,
);
