const initSqlJs = require('sql.js');

initSqlJs().then(SQL => {
  const db = new SQL.Database();
  db.run(`CREATE TABLE apps (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)`);
  db.run(`INSERT INTO apps (name) VALUES ('Test')`);
  
  
  const id = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
  console.log("ID is:", id);
  
  db.run(`INSERT INTO apps (name) VALUES ('Test2')`);
  const data = db.export(); 
  const id2 = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
  console.log("last_insert_rowid is:", id2);
});
