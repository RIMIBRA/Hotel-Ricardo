require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const db = require('./db');

async function seed() {
  console.log('Initialisation de la base de données...');

  // Admin user
  const existing = db.findOne('users', u => u.email === 'admin@hotelricardo.com');
  if (!existing) {
    const hash = await bcrypt.hash('Ricardo@2024!', 10);
    db.insert('users', { name: 'Administrateur Ricardo', email: 'admin@hotelricardo.com', password: hash, role: 'admin' });
    console.log('Admin créé: admin@hotelricardo.com / Ricardo@2024!');
  } else {
    console.log('Admin existant, ignoré.');
  }

  // Chambres
  const rooms = [
    { name: 'Chambre Simple', type: 'simple', description: "Chambre confortable avec décoration africaine, idéale pour un voyageur solo. Vue sur le jardin tropical.", price: 32000, capacity: 1, size: '18 m²', image: '', amenities: ['Climatisation', 'TV écran plat', 'WiFi gratuit', 'Salle de bain privée', 'Bureau de travail', 'Coffre-fort'], available: 1 },
    { name: 'Chambre Double', type: 'double', description: "Chambre spacieuse avec grand lit double, décorée d'œuvres d'art africaines authentiques. Vue jardin ou piscine.", price: 37000, capacity: 2, size: '24 m²', image: '', amenities: ['Climatisation', 'TV écran plat', 'WiFi gratuit', 'Salle de bain privée', 'Grand lit double', 'Terrasse privée', 'Mini-bar'], available: 1 },
    { name: 'Chambre Twin', type: 'twin', description: "Chambre avec deux lits simples, parfaite pour deux amis ou collègues. Ambiance safari chic.", price: 37000, capacity: 2, size: '24 m²', image: '', amenities: ['Climatisation', 'TV écran plat', 'WiFi gratuit', 'Salle de bain privée', 'Deux lits simples', 'Bureau de travail'], available: 1 },
    { name: 'Chambre Familiale', type: 'familiale', description: "Grande chambre familiale pouvant accueillir jusqu'à 4 personnes. Espace salon séparé et vue directe sur la piscine.", price: 52000, capacity: 4, size: '35 m²', image: '', amenities: ['Climatisation', 'TV écran plat', 'WiFi gratuit', 'Salle de bain privée', 'Espace salon', 'Vue piscine', 'Réfrigérateur', 'Bouilloire'], available: 1 },
    { name: 'Suite Junior', type: 'suite_junior', description: "Suite élégante avec salon séparé, baignoire et décoration Out of Africa raffinée.", price: 65000, capacity: 2, size: '45 m²', image: '', amenities: ['Climatisation', 'TV écran plat 50"', 'WiFi haut débit', 'Salle de bain luxueuse', 'Baignoire', 'Salon privé', 'Mini-bar premium', 'Terrasse', 'Service chambre 24h'], available: 1 },
    { name: 'Suite Présidentielle', type: 'suite_presidentielle', description: "Le summum du luxe à Ouagadougou. Salon, salle à manger, kitchenette et grande terrasse avec vue panoramique.", price: 85000, capacity: 4, size: '80 m²', image: '', amenities: ['Climatisation multi-zones', 'TV 4K 65"', 'WiFi fibre optique', 'Salle de bain marbre', 'Jacuzzi', 'Salon & salle à manger', 'Kitchenette', 'Grande terrasse panoramique', 'Butler personnel', 'Service chambre 24h', "Fruits & champagne à l'arrivée"], available: 1 }
  ];

  const existingRooms = db.findAll('rooms');
  if (existingRooms.length === 0) {
    rooms.forEach(room => { db.insert('rooms', room); console.log(`Chambre créée: ${room.name}`); });
  } else {
    console.log(`${existingRooms.length} chambre(s) existante(s), ignorées.`);
  }

  console.log('\n✅ Base de données initialisée!');
  console.log('🌐 Ouvrez: frontend/index.html');
  console.log('🔐 Admin: frontend/admin/login.html');
  console.log('   Email: admin@hotelricardo.com');
  console.log('   Mot de passe: Ricardo@2024!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
