import React, { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";

const VisitorSignup = () => {
  const [formData, setFormData] = useState({
    visitor_name: "",
    id_type: "PAN",
    id_number: "",
    vehicle_type: "Two Wheeler",
    vehicle_number: "",
    number_of_visitors: "",
    in_time: "",
    duration_minutes: "",
    visit_date: "",
  });

  const [message, setMessage] = useState("");
  const [submittedData, setSubmittedData] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const aadhaarRegex = /^[2-9]{1}[0-9]{11}$/;
    const vehicleRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;

    if (!formData.visitor_name || !formData.id_number || !formData.vehicle_number || !formData.in_time || !formData.duration_minutes || !formData.visit_date) {
      return "All fields are required.";
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

  const downloadPDF = () => {
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

    doc.save(`VisitorPass-${submittedData.visitor_name}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      {!submittedData ? (
        <form onSubmit={handleSubmit} className="bg-white shadow-lg p-8 rounded-lg max-w-md w-full space-y-4">
          <h2 className="text-2xl font-bold mb-4 text-center">Visitor Sign-Up</h2>

          <input name="visitor_name" value={formData.visitor_name} onChange={handleChange} placeholder="Full Name" className="input" />

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


