const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class AppDatabase {
  constructor() {
    this.db = null;
    this.dbPath = null;
    this.ready = this.init();
  }

  async init() {
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'express-pwa.db');
    
    const SQL = await initSqlJs();
    
    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }
    
    this.db.run(`
      CREATE TABLE IF NOT EXISTS apps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        browser TEXT DEFAULT 'firefox',
        icon_path TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE(title, url)
      )
    `);
    
    this.save();
    return this;
  }

  save() {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(this.dbPath, buffer);
  }

  getAllApps() {
    const stmt = this.db.prepare('SELECT * FROM apps ORDER BY created_at DESC');
    const apps = [];
    while (stmt.step()) {
      apps.push(stmt.getAsObject());
    }
    stmt.free();
    return apps;
  }

  getApp(id) {
    const stmt = this.db.prepare('SELECT * FROM apps WHERE id = ?');
    stmt.bind([id]);
    let app = null;
    if (stmt.step()) {
      app = stmt.getAsObject();
    }
    stmt.free();
    return app;
  }

  createApp(data) {
    this.db.run(
      `INSERT INTO apps (title, url, browser, icon_path) VALUES (?, ?, ?, ?)`,
      [data.title, data.url, data.browser, data.icon_path]
    );
    
    
    
    const id = this.db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
    
    this.save();
    
    return { id, ...data };
  }

  updateApp(id, data) {
    this.db.run(
      `UPDATE apps SET title = ?, url = ?, browser = ?, icon_path = ?, updated_at = datetime('now') WHERE id = ?`,
      [data.title, data.url, data.browser, data.icon_path, id]
    );
    this.save();
    return this.getApp(id);
  }

  deleteApp(id) {
    this.db.run('DELETE FROM apps WHERE id = ?', [id]);
    this.save();
    return { success: true };
  }

  syncApp(appData) {
    const existing = this.getApp(appData.id);
    
    if (existing) {
      console.log(`[Database] App ID ${appData.id} already exists in database`);
      return null;
    }
    
    const stmt = this.db.prepare('SELECT * FROM apps WHERE title = ? AND url = ?');
    stmt.bind([appData.title, appData.url]);
    let duplicate = null;
    if (stmt.step()) {
      duplicate = stmt.getAsObject();
    }
    stmt.free();
    
    if (duplicate) {
      console.log(`[Database] App "${appData.title}" with same URL already exists (ID: ${duplicate.id})`);
      return null;
    }
    
    console.log(`[Database] Syncing app: ${appData.title} (ID: ${appData.id})`);
    
    try {
      this.db.run(
        `INSERT INTO apps (id, title, url, browser, icon_path) VALUES (?, ?, ?, ?, ?)`,
        [appData.id, appData.title, appData.url, appData.browser, appData.icon_path]
      );
      this.save();
      
      return this.getApp(appData.id);
    } catch (error) {
      console.log(`[Database] Failed to sync app "${appData.title}": ${error.message}`);
      return null;
    }
  }
}

module.exports = AppDatabase;
