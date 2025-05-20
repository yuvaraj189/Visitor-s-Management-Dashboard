import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VisitorSignup from "./pages/visitorsignup";
import AdminLogin from "./pages/adminlogin";
import AdminDashboard from "./pages/admindashboard";
import Navbar from "./components/Navbar";
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
     <Router>
       <Navbar />
      <Routes>
        <Route path="/" element={<VisitorSignup />} />
           <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  )
}

export default App
