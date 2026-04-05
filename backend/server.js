require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid"); 
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs'); 
const crypto = require('crypto'); 

const app = express();
app.use(cors());
app.use(express.json());

// Twilio Client
const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const VERIFY_SID = process.env.TWILIO_VERIFY_SID;

// ==========================================
// 🛡️ AES-256-CBC ENCRYPTION SYSTEM
// ==========================================
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'VoteSecureHackathonKey1234567890'; 
const IV_LENGTH = 16; 

function encrypt(text) {
  if (!text) return text;
  try {
    const stringText = text.toString();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(stringText);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (e) {
    console.error("Encryption failed:", e);
    return text;
  }
}

function decrypt(text) {
  if (!text) return text;
  try {
    const textParts = text.split(':');
    if (textParts.length < 2) return text; // Not encrypted or old data format
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error("Decryption failed for a string:", error.message);
    return text; 
  }
}

// ---------------------- ROOT ROUTE ----------------------
app.get("/", (req, res) => {
  res.json({ success: true, message: "VoteSecure Secure Backend is Live 🚀", port: 5000 });
});

// ==========================================
// 🏛️ ELECTION STATUS & TIMER (GLOBAL SYNC)
// ==========================================

app.get("/api/election-status", async (req, res) => {
  try {
    const { data, error } = await supabase.from('election_status').select('*').eq('id', 1).maybeSingle();
    if (error) throw error;
    res.json({ success: true, status: data || { is_ended: false, end_time: null } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/election-status", async (req, res) => {
  try {
    const { end_time, is_ended } = req.body;
    const updateData = { id: 1 };
    
    if (end_time !== undefined) updateData.end_time = end_time;
    if (is_ended !== undefined) updateData.is_ended = is_ended;

    const { error } = await supabase.from('election_status').upsert([updateData]);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 🏛️ ELECTION ADMIN ROUTES (PERMANENT DB)
// ==========================================

app.get("/api/campaign", async (req, res) => {
  try {
    const { data } = await supabase.from('campaign').select('*').eq('id', 1).maybeSingle();
    res.json({ success: true, campaign: data || { name: "Official College Election" } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/campaign", async (req, res) => {
  try {
    const { name } = req.body;
    await supabase.from('campaign').upsert([{ id: 1, name: name }]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/candidates", async (req, res) => {
  try {
    const { data } = await supabase.from('candidates').select('*');
    res.json({ success: true, candidates: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/candidates", async (req, res) => {
  try {
    const { id, name, role } = req.body;
    await supabase.from('candidates').insert([{ id, name, role }]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/candidates/:id", async (req, res) => {
  try {
    await supabase.from('candidates').delete().eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------------- CAST VOTE (SERVER VALIDATION) ----------------------
app.post("/api/vote", async (req, res) => {
  try {
    const { candidateId } = req.body;

    // Check if election is actually active
    const { data: status } = await supabase.from('election_status').select('*').eq('id', 1).maybeSingle();
    if (status?.is_ended || (status?.end_time && Date.now() >= status.end_time)) {
      return res.status(403).json({ success: false, message: "Voting has ended." });
    }

    const { data: selected } = await supabase.from('candidates').select('name').eq('id', candidateId).maybeSingle();
    if (!selected) return res.status(400).json({ success: false, message: "Invalid candidate" });

    res.json({ success: true, message: "Vote successfully recorded", txId: uuidv4() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------------- OTP ROUTES ----------------------
app.post("/api/send-otp", async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const verification = await client.verify.v2
      .services(VERIFY_SID) 
      .verifications.create({ to: phoneNumber, channel: "sms" });
    res.json({ success: true, status: verification.status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/verify-otp", async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    const check = await client.verify.v2
      .services(VERIFY_SID)
      .verificationChecks.create({ to: phoneNumber, code: otp });
    res.json({ success: true, valid: check.status === "approved" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------------- 🛡️ SECURE REGISTRATION ----------------------
app.post("/api/register", async (req, res) => {
  try {
    const { voterId, name, department, year, phoneNumber, pin } = req.body;
    const upperId = voterId.toUpperCase().trim();

    const { data: existing } = await supabase.from("voters").select("voter_id").eq("voter_id", upperId).maybeSingle();
    if (existing) return res.status(400).json({ success: false, message: "College ID already registered" });

    const hashedPin = await bcrypt.hash(pin.toString(), 10);

    const { error } = await supabase.from("voters").insert([{
      voter_id: upperId,
      name: encrypt(name),
      department: encrypt(department),
      year: encrypt(year),
      phone_number: encrypt(phoneNumber),
      voting_pin: hashedPin,
      is_active: true
    }]);

    if (error) throw error;
    res.json({ success: true, message: "Voter registered securely" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------------- 🔓 SECURE VOTER FETCH ----------------------
app.get("/api/voter/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("voters")
      .select("voter_id, name, department, year, phone_number")
      .eq("voter_id", req.params.id.toUpperCase())
      .maybeSingle();

    if (error || !data) return res.json({ success: false, voter: null });

    res.json({
      success: true,
      voter: {
        voter_id: data.voter_id,
        name: decrypt(data.name),
        department: decrypt(data.department),
        year: decrypt(data.year),
        phone_number: decrypt(data.phone_number)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Decryption error" });
  }
});

// ---------------------- 🔐 PIN VERIFICATION ----------------------
app.post("/api/verify-pin", async (req, res) => {
  try {
    let { voterId, pin } = req.body;
    const { data } = await supabase.from("voters").select("voting_pin").eq("voter_id", voterId.toUpperCase()).maybeSingle(); 
    if (!data) return res.json({ success: false, message: "Voter not found" });

    const isMatch = await bcrypt.compare(String(pin), data.voting_pin);
    res.json({ success: true, valid: isMatch });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------------------- SERVER START ----------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});