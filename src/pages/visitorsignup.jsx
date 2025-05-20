import React, { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import QRCode from "qrcode";

const VisitorSignup = () => {
  const [formData, setFormData] = useState({
    visitor_name: "",
    email: "", // ✅ NEW FIELD
    id_type: "PAN",
    id_number: "",
    vehicle_type: "Two Wheeler",
    vehicle_number: "",
    number_of_visitors: "",
    in_time: "",
    duration_minutes: "",
    visit_date: "",
  });

  const [otp, setOtp] = useState(""); // ✅ OTP input from user
  const [otpSent, setOtpSent] = useState(false); // ✅ Track if OTP is sent
  const [otpVerified, setOtpVerified] = useState(false); // ✅ Track if OTP is verified
  const [message, setMessage] = useState("");
  const [submittedData, setSubmittedData] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const aadhaarRegex = /^[2-9]{1}[0-9]{11}$/;
    const vehicleRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.visitor_name || !formData.email || !formData.id_number || !formData.vehicle_number || !formData.in_time || !formData.duration_minutes || !formData.visit_date) {
      return "All fields are required.";
    }

    if (!emailRegex.test(formData.email)) {
      return "Invalid email format.";
    }

    if (formData.id_type === "PAN" && !panRegex.test(formData.id_number)) {
      return "Invalid PAN number format.";
    }

    if (formData.id_type === "Aadhaar" && !aadhaarRegex.test(formData.id_number)) {
      return "Invalid Aadhaar number format.";
    }

    if (!vehicleRegex.test(formData.vehicle_number)) {
      return "Invalid vehicle number format.";
    }

    if (isNaN(formData.number_of_visitors) || formData.number_of_visitors <= 0) {
      return "Number of visitors must be a positive number.";
    }

    if (isNaN(formData.duration_minutes) || formData.duration_minutes <= 0) {
      return "Duration must be a positive number.";
    }

    return null;
  };

  const sendOtp = async () => {
    if (!formData.email) return setMessage("Please enter a valid email.");
    try {
      await axios.post("http://localhost:5000/api/otp/send", { email: formData.email });
      setOtpSent(true);
      setMessage("OTP sent to your email.");
    } catch (err) {
      setMessage("Failed to send OTP.");
    }
  };

  const verifyOtp = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/otp/verify", {
        email: formData.email,
        otp,
      });
      if (res.data.verified) {
        setOtpVerified(true);
        setMessage("OTP verified successfully.");
      } else {
        setMessage("Invalid OTP.");
      }
    } catch (err) {
      setMessage("OTP verification failed.");
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const error = validate();
    if (error) return setMessage(error);
    

    try {
      const res = await axios.post("http://localhost:5000/api/visitors/signup", formData);
      const fullData = {
        ...formData,
        expected_out_time: res.data.expected_out_time,
      };
      setSubmittedData(fullData);
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong.");
    }
  };

  const downloadPDF = async () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Visitor Pass", 20, 20);

    const entries = Object.entries(submittedData);
    let y = 30;

    entries.forEach(([key, value]) => {
      const label = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      doc.setFontSize(12);
      doc.text(`${label}: ${value}`, 20, y);
      y += 10;
    });

    try {
      const qrDataUrl = await QRCode.toDataURL(JSON.stringify(submittedData));
      const qrX = 20;
      const qrY = y + 10;
      doc.text("Scan for Visitor Details:", qrX, qrY);
      doc.addImage(qrDataUrl, "PNG", qrX, qrY + 5, 50, 50);
    } catch (error) {
      console.error("QR Code generation failed", error);
    }

    doc.save(`VisitorPass-${submittedData.visitor_name}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      {!submittedData ? (
        <form onSubmit={handleSubmit} className="bg-white shadow-lg p-8 rounded-lg max-w-md w-full space-y-4">
          <h2 className="text-2xl font-bold mb-4 text-center">Visitor Sign-Up</h2>

          <input name="visitor_name" value={formData.visitor_name} onChange={handleChange} placeholder="Full Name" className="input" />
          <input name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" className="input" />

          {/*<div className="flex space-x-2">
            <button type="button" onClick={sendOtp} className="flex-1 bg-yellow-500 text-white py-1 rounded hover:bg-yellow-600">Send OTP</button>
            <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" className="flex-1 input" />
            <button type="button" onClick={verifyOtp} className="flex-1 bg-blue-500 text-white py-1 rounded hover:bg-blue-600">Verify OTP</button>
          </div>*/}

          <select name="id_type" value={formData.id_type} onChange={handleChange} className="input">
            <option value="PAN">PAN</option>
            <option value="Aadhaar">Aadhaar</option>
          </select>

          <input name="id_number" value={formData.id_number} onChange={handleChange} placeholder="ID Number" className="input" />
          <select name="vehicle_type" value={formData.vehicle_type} onChange={handleChange} className="input">
            <option value="Two Wheeler">Two Wheeler</option>
            <option value="Four Wheeler">Four Wheeler</option>
          </select>

          <input name="vehicle_number" value={formData.vehicle_number} onChange={handleChange} placeholder="Vehicle Number" className="input" />
          <input name="number_of_visitors" value={formData.number_of_visitors} onChange={handleChange} type="number" placeholder="Number of Visitors" className="input" />
          <input name="in_time" value={formData.in_time} onChange={handleChange} type="time" className="input" />
          <input name="duration_minutes" value={formData.duration_minutes} onChange={handleChange} type="number" placeholder="Duration (minutes)" className="input" />
          <input name="visit_date" value={formData.visit_date} onChange={handleChange} type="date" className="input" />

          <button type="submit" className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700">Submit</button>

          {message && <p className="text-sm text-center text-red-600">{message}</p>}
        </form>
      ) : (
        <div className="bg-white shadow-lg p-8 rounded-lg max-w-md w-full space-y-4">
          <h2 className="text-xl font-bold text-center mb-4">Visitor Summary</h2>
          <ul className="text-sm space-y-2">
            {Object.entries(submittedData).map(([key, value]) => (
              <li key={key}>
                <strong>{key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}:</strong> {value}
              </li>
            ))}
          </ul>
          <button onClick={downloadPDF} className="bg-green-600 text-white w-full py-2 rounded hover:bg-green-700">Download Visitor Pass (PDF)</button>
        </div>
      )}
    </div>
  );
};

export default VisitorSignup;
