const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

  const user = db.findOne('users', u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Identifiants incorrects' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = db.findOne('users', u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

router.put('/password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = db.findOne('users', u => u.id === req.user.id);
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
  const hash = await bcrypt.hash(newPassword, 10);
  db.updateWhere('users', u => u.id === req.user.id, { password: hash });
  res.json({ message: 'Mot de passe mis à jour' });
});

module.exports = router;
