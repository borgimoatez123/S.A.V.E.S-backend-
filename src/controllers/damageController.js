const Damage = require('../models/Damage');

// @desc    Receive and store a damage report from ESP32
// @route   POST /api/damages
// @access  Public
exports.createDamage = async (req, res) => {
  try {
    const {
      degat, force_N, vitesse_ms,
      distance_debut_mm, distance_fin_mm, delta_distance_mm,
      delta_temps_s, heure_debut, heure_fin,
      seuil_N, masse_kg, location,
    } = req.body;

    if (!location || location.latitude === undefined || location.longitude === undefined) {
      return res.status(400).json({ success: false, message: 'location.latitude and location.longitude are required' });
    }

    const damage = await Damage.create({
      isDamage: 1,
      degat,
      force_N:           parseFloat(force_N),
      vitesse_ms:        parseFloat(vitesse_ms),
      distance_debut_mm: parseFloat(distance_debut_mm),
      distance_fin_mm:   parseFloat(distance_fin_mm),
      delta_distance_mm: parseFloat(delta_distance_mm),
      delta_temps_s:     parseFloat(delta_temps_s),
      heure_debut,
      heure_fin,
      seuil_N,
      masse_kg,
      location,
    });

    console.log(`[Damage] ${damage.degat} — force: ${damage.force_N}N — at (${damage.location.latitude}, ${damage.location.longitude})`);

    return res.status(201).json({ success: true, data: damage });
  } catch (err) {
    console.error('[Damage] Error saving damage report:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
