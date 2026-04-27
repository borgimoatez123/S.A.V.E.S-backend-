const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  latitude: { type: Number, required: [true, 'Latitude is required'] },
  longitude: { type: Number, required: [true, 'Longitude is required'] },
}, { _id: false });

const DamageSchema = new mongoose.Schema({
  isDamage:            { type: Number, default: 1 },
  degat:               { type: String, trim: true },
  force_N:             { type: Number },
  vitesse_ms:          { type: Number },
  distance_debut_mm:   { type: Number },
  distance_fin_mm:     { type: Number },
  delta_distance_mm:   { type: Number },
  delta_temps_s:       { type: Number },
  heure_debut:         { type: String, trim: true },
  heure_fin:           { type: String, trim: true },
  seuil_N:             { type: Number },
  masse_kg:            { type: Number },
  gps_fixe:            { type: Boolean },
  satellites:          { type: Number },
  hdop:                { type: Number },
  location:            { type: locationSchema, required: true },
  createdAt:           { type: Date, default: Date.now },
});

module.exports = mongoose.model('Damage', DamageSchema);
