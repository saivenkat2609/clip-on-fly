import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// SECURITY FIX: Removed console error/warning suppression
// Global console suppression can hide legitimate application errors and make debugging impossible.
// Instead, use:
// 1. Error Boundary components to catch React errors
// 2. Structured logging service (e.g., Sentry, LogRocket) for production error tracking
// 3. Proper try-catch blocks for expected errors
// 4. Users with browser extensions will see extension-related errors, which is acceptable

createRoot(document.getElementById("root")!).render(<App />);
