require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const ExcelJS = require('exceljs');
const connectDB = require('./config/db');
const Response = require('./models/Response');
const Admin = require('./models/Admin');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_research_key_192837';

// Middleware for Admin Authorization (JWT token validation)
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided, authorization denied' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: not an admin' });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token is not valid or has expired' });
  }
};

// Helper: Loose server-side word count check (optional, max 160 words)
const isWordCountAcceptable = (text) => {
  if (!text || text.trim() === '') return true; // Optional: empty text is valid
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return wordCount <= 160; // Allow max 160 words
};

// @route   GET /api/participant/start
// @desc    Generate participant uuid and assign random AI advice version
// @access  Public
app.get('/api/participant/start', (req, res) => {
  try {
    const participantId = uuidv4();
    const conditions = ['direct', 'brief', 'detailed'];
    const aiVersion = conditions[Math.floor(Math.random() * conditions.length)];
    res.json({ participantId, aiVersion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error generating participant session' });
  }
});

// @route   POST /api/participant/submit
// @desc    Submit full anonymous participant response record
// @access  Public
app.post('/api/participant/submit', async (req, res) => {
  try {
    const { participantId, consentGiven, demographics, aiVersion, mcq, openEnded } = req.body;

    // Validate overall structure
    if (!participantId || consentGiven === undefined || !demographics || !aiVersion || !mcq || !openEnded) {
      return res.status(400).json({ error: 'Invalid payload: Missing survey fields.' });
    }

    if (!consentGiven) {
      return res.status(400).json({ error: 'Consent is required to submit results.' });
    }

    // Demographics validation
    const { age, gender, grade, stream, familyCareerLeaning } = demographics;
    if (!age || !gender || !grade || !stream || !familyCareerLeaning) {
      return res.status(400).json({ error: 'All demographic fields are required.' });
    }

    if (!['Male', 'Female', 'Non-binary', 'Prefer not to say'].includes(gender)) {
      return res.status(400).json({ error: 'Invalid gender value.' });
    }

    if (!['computer_science', 'medicine', 'both_supportive', 'neither', 'not_applicable'].includes(familyCareerLeaning)) {
      return res.status(400).json({ error: 'Invalid family career leaning option.' });
    }

    // AI condition validation
    if (!['direct', 'brief', 'detailed'].includes(aiVersion)) {
      return res.status(400).json({ error: 'Invalid AI condition assigned.' });
    }

    // MCQ validation
    const { careerChoice, confidence, wouldVerify, aiInfluence, helpedThinkCarefully } = mcq;
    if (
      !['computer_science', 'medicine'].includes(careerChoice) ||
      !confidence || confidence < 1 || confidence > 5 ||
      !['Yes', 'No'].includes(wouldVerify) ||
      !aiInfluence || aiInfluence < 1 || aiInfluence > 5 ||
      !['Yes', 'No'].includes(helpedThinkCarefully)
    ) {
      return res.status(400).json({ error: 'All MCQ responses are required and must be valid.' });
    }

    // Open-ended answers validation
    const openEndedFields = ['whyChoice', 'influentialPart', 'unhelpfulOrMisleading', 'improvementSuggestion'];
    for (const field of openEndedFields) {
      if (!isWordCountAcceptable(openEnded[field])) {
        return res.status(400).json({
          error: `Open-ended responses must not exceed 150 words. Check field: ${field}`
        });
      }
    }

    // Check if participantId already exists
    const existing = await Response.findOne({ participantId });
    if (existing) {
      return res.status(400).json({ error: 'This participant has already submitted responses.' });
    }

    const newResponse = new Response({
      participantId,
      consentGiven,
      demographics,
      aiVersion,
      mcq,
      openEnded
    });

    await newResponse.save();
    res.status(201).json({ success: true, message: 'Responses recorded anonymously.' });
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ error: 'Server error saving submission.' });
  }
});

// @route   POST /api/admin/login
// @desc    Authenticate admin and return JWT
// @access  Public
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Generate JWT token with role "admin"
    const token = jwt.sign(
      { username: admin.username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ success: true, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// @route   GET /api/admin/responses
// @desc    Get all survey responses
// @access  Private (Admin)
app.get('/api/admin/responses', authenticateAdmin, async (req, res) => {
  try {
    const responses = await Response.find().sort({ submittedAt: -1 });
    res.json(responses);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching responses.' });
  }
});

// @route   GET /api/admin/stats
// @desc    Get dashboard metrics & aggregation
// @access  Private (Admin)
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const responses = await Response.find();
    const total = responses.length;

    if (total === 0) {
      return res.json({
        total: 0,
        aiConditions: { direct: 0, brief: 0, detailed: 0 },
        careerChoices: { computer_science: 0, medicine: 0 },
        genderDistribution: { Male: 0, Female: 0, 'Non-binary': 0, 'Prefer not to say': 0 },
        avgConfidence: 0,
        avgInfluence: 0,
        avgConfidencePerVersion: { direct: 0, brief: 0, detailed: 0 },
        avgInfluencePerVersion: { direct: 0, brief: 0, detailed: 0 },
        careerChoicePerVersion: {
          direct: { computer_science: 0, medicine: 0 },
          brief: { computer_science: 0, medicine: 0 },
          detailed: { computer_science: 0, medicine: 0 }
        }
      });
    }

    const aiConditions = { direct: 0, brief: 0, detailed: 0 };
    const careerChoices = { computer_science: 0, medicine: 0 };
    const genderDistribution = { Male: 0, Female: 0, 'Non-binary': 0, 'Prefer not to say': 0 };

    let totalConfidence = 0;
    let totalInfluence = 0;

    const versionStats = {
      direct: { totalConfidence: 0, totalInfluence: 0, count: 0 },
      brief: { totalConfidence: 0, totalInfluence: 0, count: 0 },
      detailed: { totalConfidence: 0, totalInfluence: 0, count: 0 }
    };

    const careerChoicePerVersion = {
      direct: { computer_science: 0, medicine: 0 },
      brief: { computer_science: 0, medicine: 0 },
      detailed: { computer_science: 0, medicine: 0 }
    };

    responses.forEach(r => {
      // Direct sums
      aiConditions[r.aiVersion]++;
      careerChoices[r.mcq.careerChoice]++;
      genderDistribution[r.demographics.gender] = (genderDistribution[r.demographics.gender] || 0) + 1;
      
      totalConfidence += r.mcq.confidence;
      totalInfluence += r.mcq.aiInfluence;

      // Grouped by version
      const version = r.aiVersion;
      if (versionStats[version]) {
        versionStats[version].totalConfidence += r.mcq.confidence;
        versionStats[version].totalInfluence += r.mcq.aiInfluence;
        versionStats[version].count++;
        careerChoicePerVersion[version][r.mcq.careerChoice]++;
      }
    });

    const avgConfidencePerVersion = {};
    const avgInfluencePerVersion = {};
    Object.keys(versionStats).forEach(v => {
      const count = versionStats[v].count;
      avgConfidencePerVersion[v] = count > 0 ? parseFloat((versionStats[v].totalConfidence / count).toFixed(2)) : 0;
      avgInfluencePerVersion[v] = count > 0 ? parseFloat((versionStats[v].totalInfluence / count).toFixed(2)) : 0;
    });

    res.json({
      total,
      aiConditions,
      careerChoices,
      genderDistribution,
      avgConfidence: parseFloat((totalConfidence / total).toFixed(2)),
      avgInfluence: parseFloat((totalInfluence / total).toFixed(2)),
      avgConfidencePerVersion,
      avgInfluencePerVersion,
      careerChoicePerVersion
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error gathering stats.' });
  }
});

// Helper: Escape commas and quotes for standard CSV export
const escapeCSV = (val) => {
  if (val === undefined || val === null) return '';
  let str = String(val);
  str = str.replace(/"/g, '""');
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str}"`;
  }
  return str;
};

// @route   GET /api/admin/export/csv
// @desc    Export responses as CSV (JWT protected)
// @access  Private (Admin)
app.get('/api/admin/export/csv', authenticateAdmin, async (req, res) => {
  try {
    const responses = await Response.find().sort({ submittedAt: -1 });

    const headers = [
      'Participant ID', 'Submitted At', 'Age', 'Gender', 'Grade', 'Stream', 'Family Career Leaning',
      'AI Version', 'Career Choice Decision', 'Confidence (1-5)', 'Verify Advice', 'AI Influence Level (1-5)',
      'Helped Think Carefully', 'Why Choice Response', 'AI Response Influential Part', 'Unhelpful/Misleading Part',
      'Improvement Suggestion'
    ];

    const rows = responses.map(r => [
      r.participantId,
      r.submittedAt ? r.submittedAt.toISOString() : '',
      r.demographics.age,
      r.demographics.gender,
      r.demographics.grade,
      r.demographics.stream,
      r.demographics.familyCareerLeaning,
      r.aiVersion,
      r.mcq.careerChoice,
      r.mcq.confidence,
      r.mcq.wouldVerify,
      r.mcq.aiInfluence,
      r.mcq.helpedThinkCarefully,
      r.openEnded.whyChoice,
      r.openEnded.influentialPart,
      r.openEnded.unhelpfulOrMisleading,
      r.openEnded.improvementSuggestion
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=participants_data.csv');
    // Send with UTF-8 BOM
    res.send('\uFEFF' + csvContent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error generating CSV.' });
  }
});

// @route   GET /api/admin/export/excel
// @desc    Export responses in native .xlsx spreadsheet format via exceljs (JWT protected)
// @access  Private (Admin)
app.get('/api/admin/export/excel', authenticateAdmin, async (req, res) => {
  try {
    const responses = await Response.find().sort({ submittedAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('AI Research Responses');

    // Define columns
    worksheet.columns = [
      { header: 'Participant ID', key: 'participantId', width: 40 },
      { header: 'Submitted At', key: 'submittedAt', width: 25 },
      { header: 'Age', key: 'age', width: 10 },
      { header: 'Gender', key: 'gender', width: 15 },
      { header: 'Grade/Class', key: 'grade', width: 15 },
      { header: 'Stream', key: 'stream', width: 15 },
      { header: 'Family Career Leaning', key: 'familyLeaning', width: 25 },
      { header: 'AI Version', key: 'aiVersion', width: 15 },
      { header: 'Career Choice Decision', key: 'careerChoice', width: 22 },
      { header: 'Confidence (1-5)', key: 'confidence', width: 15 },
      { header: 'Would Verify', key: 'wouldVerify', width: 15 },
      { header: 'AI Influence Level (1-5)', key: 'aiInfluence', width: 22 },
      { header: 'Helped Think Carefully', key: 'thinkCarefully', width: 22 },
      { header: 'Why Career Choice', key: 'whyChoice', width: 45 },
      { header: 'Influential Part', key: 'influentialPart', width: 45 },
      { header: 'Unhelpful/Misleading', key: 'unhelpfulOrMisleading', width: 45 },
      { header: 'Improvement Suggestion', key: 'improvementSuggestion', width: 45 }
    ];

    // Style headers
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF6366F1' } // Purple accent
    };

    // Add rows
    responses.forEach(r => {
      worksheet.addRow({
        participantId: r.participantId,
        submittedAt: r.submittedAt ? r.submittedAt.toISOString() : '',
        age: r.demographics.age,
        gender: r.demographics.gender,
        grade: r.demographics.grade,
        stream: r.demographics.stream,
        familyLeaning: r.demographics.familyCareerLeaning,
        aiVersion: r.aiVersion,
        careerChoice: r.mcq.careerChoice,
        confidence: r.mcq.confidence,
        wouldVerify: r.mcq.wouldVerify,
        aiInfluence: r.mcq.aiInfluence,
        thinkCarefully: r.mcq.helpedThinkCarefully,
        whyChoice: r.openEnded.whyChoice,
        influentialPart: r.openEnded.influentialPart,
        unhelpfulOrMisleading: r.openEnded.unhelpfulOrMisleading,
        improvementSuggestion: r.openEnded.improvementSuggestion
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=participants_data.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ error: 'Server error generating Excel file.' });
  }
});

// @route   GET /api/admin/export/json
// @desc    Export responses as raw JSON for direct Pandas analysis (JWT protected)
// @access  Private (Admin)
app.get('/api/admin/export/json', authenticateAdmin, async (req, res) => {
  try {
    const responses = await Response.find().sort({ submittedAt: -1 });
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=responses_raw.json');
    res.json(responses);
  } catch (error) {
    res.status(500).json({ error: 'Server error exporting JSON data.' });
  }
});

// Port configuration
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
