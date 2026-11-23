// Mock server verify.php — ayan-tool (tiny.loader)
// Deploy: push repo ini ke GitHub, lalu Import di Vercel (framework: Other, tanpa build).
// Endpoint jadi: https://<project>.vercel.app/verify.php
// (vercel.json me-rewrite /verify.php -> /api/verify)
//
// FORMULA (terbukti dari libtool.so Check() + 1 sample JSON server dosen):
//   token = md5(user_key + serial)   // tanpa pemisah, hex lowercase
//   rng   = unix timestamp detik saat response dibuat
//   EXP   = tanggal expiry key (dari DB KEYS di bawah)
// Client (native Check()) HANYA membaca data.EXP dari JSON — status,
// token, rng, used_devices, max_devices tidak pernah dibaca client.
// Jadi yang wajib benar: bentuk JSON + data.EXP. Token/rng diisi sesuai
// formula asli supaya tetap identik dengan server dosen.
//
// Tambah key baru: tambah 1 baris di KEYS dengan EXP-nya.
const crypto = require('crypto');

const KEYS = {
  // key: { EXP: "YYYY-MM-DD HH:MM:SS", used_devices, max_devices }
  'VIP-FREE-V1': { EXP: '2099-11-25 23:48:42', used_devices: 1, max_devices: 10000 },
};

module.exports = (req, res) => {
  const q = req.query || {};
  const game = q.game || '';
  const user_key = q.user_key || '';
  const serial = q.serial || '';

  if (!user_key) {
    return res.status(200).json({ status: false, reason: 'KEY REQUIRED' });
  }

  const rec = KEYS[user_key];
  if (!rec) {
    return res.status(200).json({ status: false, reason: 'INVALID KEY' });
  }

  const token = crypto.createHash('md5').update(user_key + serial).digest('hex');
  const rng = Math.floor(Date.now() / 1000);

  return res.status(200).json({
    status: true,
    data: {
      EXP: rec.EXP,
      used_devices: rec.used_devices,
      max_devices: rec.max_devices,
      token,
      rng,
    },
  });
};
