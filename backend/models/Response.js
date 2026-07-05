const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  participantId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  consentGiven: {
    type: Boolean,
    required: true
  },
  demographics: {
    age: { type: Number, required: true },
    gender: { 
      type: String, 
      enum: ['Male', 'Female', 'Non-binary', 'Prefer not to say'], 
      required: true 
    },
    grade: { type: String, required: true },
    stream: { type: String, required: true },
    familyCareerLeaning: { 
      type: String, 
      enum: ['computer_science', 'medicine', 'both_supportive', 'neither', 'not_applicable'], 
      required: true 
    }
  },
  aiVersion: {
    type: String,
    enum: ['direct', 'brief', 'detailed'],
    required: true
  },
  mcq: {
    careerChoice: { type: String, enum: ['computer_science', 'medicine'], required: true },
    confidence: { type: Number, min: 1, max: 5, required: true },
    wouldVerify: { type: String, enum: ['Yes', 'No'], required: true },
    aiInfluence: { type: Number, min: 1, max: 5, required: true },
    helpedThinkCarefully: { type: String, enum: ['Yes', 'No'], required: true }
  },
  openEnded: {
    whyChoice: { type: String, required: true },
    influentialPart: { type: String, required: true },
    unhelpfulOrMisleading: { type: String, required: true },
    improvementSuggestion: { type: String, required: true }
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Response', responseSchema);
