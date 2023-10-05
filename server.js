const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

app.use(bodyParser.json());


const db = new sqlite3.Database('inventory.db');


db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS barang (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_barang TEXT,
      stok INTEGER,
      jumlah_terjual INTEGER,
      tanggal_transaksi DATE,
      jenis_barang TEXT
    )
  `);
});

app.post('/barang', (req, res) => {
  const productName = req.body.nama_barang; 
  console.log(productName);
  if (!productName) {
   
    db.all('SELECT * FROM barang', (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        status:"success",
        data:rows
      });
    });
  }else{
    const query = 'SELECT * FROM barang WHERE nama_barang LIKE ?'; 

    db.all(query, [`%${productName}%`], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Produk tidak ditemukan.' });
      }
  
      res.json({
        status: "success",
        data: rows
      });
    });
  }


});



app.post('/createBarang', (req, res) => {
  const { nama_barang, stok, jumlah_terjual, tanggal_transaksi, jenis_barang } = req.body;
  db.run(
    'INSERT INTO barang (nama_barang, stok, jumlah_terjual, tanggal_transaksi, jenis_barang) VALUES (?, ?, ?, ?, ?)',
    [nama_barang, stok, jumlah_terjual, tanggal_transaksi, jenis_barang],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(
        {
        status:"success",
        data:{
        id: this.lastID,
        nama_barang,
        stok,
        jumlah_terjual,
        tanggal_transaksi,
        jenis_barang,
      }
    }
      );
    }
  );
});

app.put('/barang/:id', (req, res) => {
  const id = req.params.id;
  const { nama_barang, stok, jumlah_terjual, tanggal_transaksi, jenis_barang } = req.body;
  db.run(
    'UPDATE barang SET nama_barang=?, stok=?, jumlah_terjual=?, tanggal_transaksi=?, jenis_barang=? WHERE id=?',
    [nama_barang, stok, jumlah_terjual, tanggal_transaksi, jenis_barang, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        id,
        nama_barang,
        stok,
        jumlah_terjual,
        tanggal_transaksi,
        jenis_barang,
      });
    }
  );
});


app.delete('/barang/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM barang WHERE id=?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Data barang berhasil dihapus' });
  });
});


app.delete('/barang', (req, res) => {
  db.run('DELETE FROM barang', function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Semua data barang berhasil dihapus' });
  });
});

app.get('/penjualan-tertinggi', (req, res) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  console.log(startDate);
  console.log(endDate);
  const sql = `
    SELECT * FROM barang
    WHERE tanggal_transaksi >= ? AND tanggal_transaksi <= ?
    ORDER BY jumlah_terjual DESC
    LIMIT 1
  `;
  db.get(sql, [startDate, endDate], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: 'Data penjualan tertinggi tidak ditemukan' });
    }
    res.json(row);
  });
});


app.get('/penjualan-terendah', (req, res) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  const sql = `
    SELECT * FROM barang
    WHERE tanggal_transaksi >= ? AND tanggal_transaksi <= ?
    ORDER BY jumlah_terjual ASC
    LIMIT 1
  `;
  db.get(sql, [startDate, endDate], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: 'Data penjualan terendah tidak ditemukan' });
    }
    res.json(row);
  });
});


app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
