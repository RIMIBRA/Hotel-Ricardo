const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const adapter = new FileSync(path.join(__dirname, 'hotel_ricardo.json'));
const db = low(adapter);

db.defaults({
  users: [],
  rooms: [],
  reservations: [],
  payments: [],
  contact_messages: [],
  _counters: {}
}).write();

// Helper: auto-increment ID
db.nextId = function(table) {
  const cur = this.get(`_counters.${table}`).value() || 0;
  const next = cur + 1;
  this.set(`_counters.${table}`, next).write();
  return next;
};

// Helper: INSERT
db.insert = function(table, data) {
  const id = this.nextId(table);
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const record = { id, created_at: now, ...data };
  this.get(table).push(record).write();
  return record;
};

// Helper: FIND ALL with optional filter function
db.findAll = function(table, filterFn) {
  const col = this.get(table);
  return filterFn ? col.filter(filterFn).value() : col.value();
};

// Helper: FIND ONE
db.findOne = function(table, filterFn) {
  return this.get(table).find(filterFn).value() || null;
};

// Helper: UPDATE matching records
db.updateWhere = function(table, filterFn, updates) {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  this.get(table).filter(filterFn).each(record => {
    Object.assign(record, updates, { updated_at: now });
  }).write();
};

// Helper: DELETE
db.removeWhere = function(table, filterFn) {
  this.get(table).remove(filterFn).write();
};

module.exports = db;
