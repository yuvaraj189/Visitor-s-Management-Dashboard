import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VisitorSignup from "./pages/VisitorSignup";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Navbar from "./components/Navbar";
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
     <Router>
       <Navbar />
      <Routes>
        <Route path="/" element={<VisitorSignup />} />
           <Route path="/Admin/Login" element={<AdminLogin />} />
        <Route path="/Admin/Dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  )
}

export default App
