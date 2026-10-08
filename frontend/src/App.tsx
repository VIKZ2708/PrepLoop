import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Study from "./pages/Study";
import Project from "./pages/Project";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/study" element={<Study />} />
        <Route path="/project" element={<Project />} />
      </Routes>
    </BrowserRouter>
  );
}
