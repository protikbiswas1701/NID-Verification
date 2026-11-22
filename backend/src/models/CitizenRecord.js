import mongoose from 'mongoose';

const citizenRecordSchema = new mongoose.Schema(
  {
    nid: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    nameBn: {
      type: String,
      trim: true,
      default: null,
    },
    dob: {
      type: String,
      required: true,
      trim: true,
    },
    bloodGroup: {
      type: String,
      trim: true,
      default: null,
    },
    father: {
      type: String,
      trim: true,
      default: null,
    },
    mother: {
      type: String,
      trim: true,
      default: null,
    },
    birthPlace: {
      type: String,
      trim: true,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    barcodePin: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const CitizenRecord = mongoose.model('CitizenRecord', citizenRecordSchema);
export default CitizenRecord;
