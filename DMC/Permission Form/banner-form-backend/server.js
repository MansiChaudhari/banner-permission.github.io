const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql2");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL Database Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Mansi@26",
    database: "bannerDB",
});

// Connect to MySQL
db.connect(err => {
    if (err) {
        console.error("Database connection failed:", err.message);
        process.exit(1);
    }
    console.log("Connected to MySQL database.");
});

// Directory to store QR code images
const qrCodeDir = path.join(__dirname, "qrcodes");
if (!fs.existsSync(qrCodeDir)) {
    fs.mkdirSync(qrCodeDir, { recursive: true });
}

// Endpoint: Submit Form
app.post("/submit-form", (req, res) => {
    const {
        applicantName,
        contactNumber,
        bannerLocation,
        bannerSize,
        startDate,
        endDate,
        ratePerDay,
    } = req.body;

    if (!applicantName || !contactNumber || !bannerLocation || !bannerSize || !startDate || !endDate || !ratePerDay) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const totalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
    const totalPayment = totalDays * ratePerDay;

    const query = `
        INSERT INTO banner_form 
        (applicant_name, contact_number, banner_location, banner_size, start_date, end_date, rate_per_day, total_days, total_payment, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.execute(query, [applicantName, contactNumber, bannerLocation, bannerSize, startDate, endDate, ratePerDay, totalDays, totalPayment, "Pending"], (err, result) => {
        if (err) {
            console.error("Failed to insert data:", err.message);
            return res.status(500).json({ message: "Error storing form data" });
        }

        res.json({ message: "Form submitted successfully!", id: result.insertId, totalPayment });
    });
});

// Endpoint: Make Payment
app.post("/make-payment", (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: "ID is required" });
    }

    const query = `UPDATE banner_form SET status = ? WHERE id = ?`;
    db.execute(query, ["Paid", id], (err, result) => {
        if (err) {
            console.error("Failed to update payment status:", err.message);
            return res.status(500).json({ message: "Error processing payment" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Form not found" });
        }

        res.json({ message: "Payment successful! You can now generate the QR code." });
    });
});

// Endpoint: Generate QR Code
app.get("/generate-qr/:id", (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "ID is required" });
    }

    const query = `SELECT * FROM banner_form WHERE id = ?`;
    db.execute(query, [id], async (err, rows) => {
        if (err) {
            console.error("Failed to fetch data:", err.message);
            return res.status(500).json({ message: "Error retrieving data" });
        }

        if (rows.length === 0) {
            return res.status(404).json({ message: "Form not found" });
        }

        const formData = rows[0];

        // Check if payment has been made
        if (formData.status !== "Paid") {
            return res.status(400).json({ message: "Payment not completed. QR code cannot be generated." });
        }

        // Save QR Code as a file
        const qrCodeImagePath = path.join(qrCodeDir, `${id}_qrcode.png`);

        try {
            await QRCode.toFile(qrCodeImagePath, JSON.stringify(formData), {
                type: "png",
                width: 300,
                errorCorrectionLevel: "H",
            });
            res.sendFile(qrCodeImagePath);
        } catch (error) {
            console.error("Failed to generate QR Code:", error.message);
            res.status(500).json({ message: "Failed to generate QR Code" });
        }
    });
});

// Serve QR Code Images
app.use("/qrcodes", express.static(qrCodeDir));

// Start the Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
