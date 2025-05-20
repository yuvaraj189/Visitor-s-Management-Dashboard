const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const qrcode = require('qrcode');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MySQL Connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to MySQL database');
  connection.release();
});
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const otpStore = new Map();

// Send OTP
app.post('/api/otp/send', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, otp);

  setTimeout(() => otpStore.delete(email), 5 * 60 * 1000);

  transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}`,
  }, (err) => {
    if (err) {
      console.error('Email error:', err);
      return res.status(500).json({ message: 'Failed to send OTP' });
    }
    res.json({ message: 'OTP sent to email' });
  });
});

// Verify OTP
app.post('/api/otp/verify', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

  const validOtp = otpStore.get(email);
  if (validOtp === otp) {
    otpStore.delete(email);
    res.json({ verified: true, message: 'OTP verified successfully' });
  } else {
    res.status(401).json({ verified: false, message: 'Invalid or expired OTP' });
  }
});


// Admin Login Route
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  pool.query('SELECT * FROM admin WHERE username = ?', [username], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

    const admin = results[0];
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  });
});

// Middleware to protect routes
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(500).json({ message: 'Failed to authenticate token' });
    req.adminId = decoded.id;
    next();
  });
};

// Visitor Sign-Up Route
app.post('/api/visitors/signup', (req, res) => {
  const {
  visitor_name,
  id_number,
  id_type,
  email,
  vehicle_type,
  vehicle_number,
  number_of_visitors,
  in_time,
  duration_minutes,
  visit_date,
} = req.body;

if (
  !visitor_name ||
  !id_number ||
  !id_type ||
  !vehicle_type ||
  !vehicle_number ||
  !number_of_visitors ||
  !in_time ||
  !duration_minutes ||
  !visit_date ||
  !email
) {
  return res.status(400).json({ message: 'All fields are required.' });
}

  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const aadhaarRegex = /^[2-9]{1}[0-9]{11}$/;
  const vehicleRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return res.status(400).json({ message: 'Invalid email format.' });
}
  if (id_type === 'PAN' && !panRegex.test(id_number)) {
    return res.status(400).json({ message: 'Invalid PAN number format.' });
  }

  if (id_type === 'Aadhaar' && !aadhaarRegex.test(id_number)) {
    return res.status(400).json({ message: 'Invalid Aadhaar number format.' });
  }

  if (!vehicleRegex.test(vehicle_number)) {
    return res.status(400).json({ message: 'Invalid vehicle number format.' });
  }

  if (isNaN(number_of_visitors) || number_of_visitors <= 0) {
    return res.status(400).json({ message: 'Number of visitors must be a positive number.' });
  }

  if (isNaN(duration_minutes) || duration_minutes <= 0) {
    return res.status(400).json({ message: 'Duration must be a positive number of minutes.' });
  }

  const expected_out_time = moment(`${visit_date} ${in_time}`, 'YYYY-MM-DD HH:mm')
    .add(duration_minutes, 'minutes')
    .format('YYYY-MM-DD HH:mm');

  pool.query(
    `INSERT INTO visitors 
     (visitor_name, id_type, id_number, email, vehicle_type, vehicle_number, number_of_visitors, in_time, duration_minutes, visit_date, expected_out_time, status)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
   [
  visitor_name,
  id_type,
  id_number,
  email,
  vehicle_type,
  vehicle_number,
  number_of_visitors,
  in_time,
  duration_minutes,
  visit_date,
  expected_out_time,
   ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }
      res.status(201).json({ message: 'Visitor request submitted successfully', expected_out_time });
    }
  );
});
// Get all visitors
app.get('/api/visitors', verifyToken, (req, res) => {
  pool.query('SELECT * FROM visitors ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(results);
  });
});
app.put('/api/visitors/:id/status', verifyToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['approved', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  pool.query(
    'UPDATE visitors SET status = ? WHERE id = ?',
    [status, id],
    (err, result) => {
      if (err) {
        console.error('Error updating visitor status:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Visitor not found' });
      }

      res.json({ message: 'Visitor status updated successfully' });
    }
  );
});

// Export to Excel
app.get('/api/admin/export/excel', verifyToken, (req, res) => {
  pool.query('SELECT * FROM visitors', async (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Visitors');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Visitor Name', key: 'visitor_name', width: 20 },
      { header: 'ID Type', key: 'id_type', width: 15 },
      { header: 'ID Number', key: 'id_number', width: 20 },
      { header: 'Vehicle Type', key: 'vehicle_type', width: 15 },
      { header: 'Vehicle Number', key: 'vehicle_number', width: 20 },
      { header: 'No. of Visitors', key: 'number_of_visitors', width: 18 },
      { header: 'In Time', key: 'in_time', width: 20 },
      { header: 'Duration (min)', key: 'duration_minutes', width: 18 },
      { header: 'Visit Date', key: 'visit_date', width: 15 },
      { header: 'Expected Out Time', key: 'expected_out_time', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    worksheet.addRows(rows);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=visitors.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  });
});

// Visitor Slip PDF Generation
app.get('/api/visitor/slip/:id', verifyToken, (req, res) => {
  const visitorId = req.params.id;

  pool.query('SELECT * FROM visitors WHERE id = ?', [visitorId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    const visitor = results[0];
    const doc = new PDFDocument();
    const filename = `VisitorSlip-${visitor.id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${filename}`);

    doc.pipe(res);

    doc.fontSize(20).text('Visitor Slip', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${visitor.visitor_name}`);
    doc.text(`ID Type: ${visitor.id_type}`);
    doc.text(`ID Number: ${visitor.id_number}`);
    doc.text(`Vehicle Type: ${visitor.vehicle_type}`);
    doc.text(`Vehicle Number: ${visitor.vehicle_number}`);
    doc.text(`Number of Visitors: ${visitor.number_of_visitors}`);
    doc.text(`In Time: ${visitor.in_time}`);
    doc.text(`Duration: ${visitor.duration_minutes} minutes`);
    doc.text(`Visit Date: ${visitor.visit_date}`);
    doc.text(`Expected Out Time: ${visitor.expected_out_time}`);
    doc.text(`Status: ${visitor.status}`);
    const qrData = `Visitor: ${visitor.visitor_name}, In Time: ${visitor.in_time}, Out Time: ${visitor.expected_out_time}`;
qrcode.toDataURL(qrData, (err, qrUrl) => {
  if (!err) {
    doc.image(qrUrl, { fit: [100, 100], align: 'center' });
  }
  doc.end();
});
    doc.end();
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  