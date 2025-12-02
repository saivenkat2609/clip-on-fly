import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress browser extension related errors in console
const originalConsoleError = console.error;
console.error = (...args) => {
  const errorMessage = args.join(' ');

  // Filter out browser extension blocking errors
  if (
    errorMessage.includes('ERR_BLOCKED_BY_CLIENT') ||
    errorMessage.includes('Cross-Origin-Opener-Policy') ||
    errorMessage.includes('window.closed')
  ) {
    return; // Silently ignore these errors
  }

  // Log all other errors normally
  originalConsoleError.apply(console, args);
};

// Suppress network errors caused by browser extensions
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  const warnMessage = args.join(' ');

  if (
    warnMessage.includes('ERR_BLOCKED_BY_CLIENT') ||
    warnMessage.includes('Failed to update Auth profile')
  ) {
    return; // Silently ignore these warnings
  }

  originalConsoleWarn.apply(console, args);
};

createRoot(document.getElementById("root")!).render(<App />);
