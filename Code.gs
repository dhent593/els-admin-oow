function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('ELS Admin Service Dashboard')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ----------------------------------------------------
// KONFIGURASI DATABASE SPREADSHEET
// ----------------------------------------------------
// Jika akan digabungkan dengan spreadsheet tertentu, isi ID-nya di sini
const SPREADSHEET_ID = "15gQrj8MUMPOcohKkO_SKpoDy5Ml1BnHH3hqxqZY9nqQ";
// Jika kosong, script akan menggunakan Spreadsheet yang aktif (jika di-bound ke sheet)

let cachedSpreadsheet = null;

function getSpreadsheet() {
  if (cachedSpreadsheet) return cachedSpreadsheet;
  
  let dbId = SPREADSHEET_ID;
  if (!dbId || dbId.trim() === "") {
    const props = PropertiesService.getScriptProperties();
    dbId = props.getProperty('DB_SHEET_ID');
    
    if (!dbId) {
      const newDb = SpreadsheetApp.create("Database_ELS_Admin_Service");
      dbId = newDb.getId();
      props.setProperty('DB_SHEET_ID', dbId);
    }
  }
  cachedSpreadsheet = SpreadsheetApp.openById(dbId);
  return cachedSpreadsheet;
}

function getDbSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName("Data_Service");
  
  // Inisialisasi Header jika sheet belum ada
  if (!sheet) {
    sheet = ss.insertSheet("Data_Service");
    const headers = [
      "Kode", "Status", "Kategori_File", "Pelanggan", "No_HP", "Unit", "SN", 
      "Garansi", "Kebutuhan_Part", "Status_Part", "Vendor", "Tanggal_Masuk", "Is_Closed"
    ];
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

function getSettingsSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName("Settings");
  
  if (!sheet) {
    sheet = ss.insertSheet("Settings");
    sheet.appendRow(["Keyword", "Color"]);
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

function getStockSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName("Stock Nomor Seri/Produksi Per Barang");
  
  if (!sheet) {
    sheet = ss.insertSheet("Stock Nomor Seri/Produksi Per Barang");
    sheet.appendRow(["No Seri/Produksi", "Nama Barang", "Kode Barang"]);
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

function getAlokasiSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName("Alokasi Part");
  
  if (!sheet) {
    sheet = ss.insertSheet("Alokasi Part");
    sheet.appendRow(["Nomor Tanda Terima", "SN", "Nama Barang", "Tanggal Alokasi", "Keterangan"]);
    sheet.setFrozenRows(1);
  } else {
    // Update header lama "Tanda Terima" atau "Kode / Status" ke "Nomor Tanda Terima" jika masih pakai nama lama
    var firstHeader = sheet.getRange(1, 1).getValue();
    if (firstHeader === "Tanda Terima" || firstHeader === "Kode / Status") {
      sheet.getRange(1, 1).setValue("Nomor Tanda Terima");
    }
    // Update header ke-5 jika belum ada
    var fifthHeader = sheet.getRange(1, 5).getValue();
    if (!fifthHeader) {
      sheet.getRange(1, 5).setValue("Keterangan");
    }
  }
  
  return sheet;
}

function getCabangSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName("Cabang");
  
  if (!sheet) {
    sheet = ss.insertSheet("Cabang");
    sheet.appendRow(["Nama Cabang"]);
    sheet.setFrozenRows(1);
    
    // Default initial data
    sheet.appendRow(["Semarang"]);
    sheet.appendRow(["Purwokerto"]);
  }
  
  return sheet;
}

function saveCabang(namaCabang) {
  try {
    if (!namaCabang || namaCabang.trim() === "") return { success: false, error: "Nama cabang kosong" };
    const sheet = getCabangSheet();
    sheet.appendRow([namaCabang.trim()]);
    return { success: true, namaCabang: namaCabang.trim() };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

// ----------------------------------------------------
// AUTENTIKASI
// ----------------------------------------------------
function getAuthSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName("Users");
  
  if (!sheet) {
    sheet = ss.insertSheet("Users");
    sheet.appendRow(["Username", "Password"]);
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

function verifyLogin(username, password) {
  try {
    const sheet = getAuthSheet();
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == username && data[i][1] == password) {
        return { success: true, message: "Login berhasil" };
      }
    }
    return { success: false, message: "Username atau password salah" };
  } catch (e) {
    return { success: false, message: "Terjadi kesalahan: " + e.message };
  }
}

// ----------------------------------------------------
// USER MANAGEMENT API
// ----------------------------------------------------
function getAllUsers() {
  try {
    const sheet = getAuthSheet();
    const data = sheet.getDataRange().getValues();
    const users = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) users.push(data[i][0].toString());
    }
    return { success: true, users: users };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function addNewUser(username, password) {
  try {
    if (!username || !password) return { success: false, error: "Username dan Password harus diisi." };
    const sheet = getAuthSheet();
    const data = sheet.getDataRange().getValues();
    
    // Check if username exists
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == username) {
        return { success: false, error: "Username sudah ada." };
      }
    }
    
    sheet.appendRow([username, password]);
    return { success: true, message: "User berhasil ditambahkan." };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function updateUserPassword(username, newPassword) {
  try {
    if (!newPassword) return { success: false, error: "Password baru tidak boleh kosong." };
    const sheet = getAuthSheet();
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == username) {
        sheet.getRange(i + 1, 2).setValue(newPassword);
        return { success: true, message: "Password berhasil diubah." };
      }
    }
    return { success: false, error: "User tidak ditemukan." };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function removeUser(username) {
  try {
    const sheet = getAuthSheet();
    const data = sheet.getDataRange().getValues();
    
    // Check minimum 1 user remaining
    if (data.length <= 2) return { success: false, error: "Gagal: Harus ada minimal 1 user admin tersisa." };
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == username) {
        sheet.deleteRow(i + 1);
        return { success: true, message: "User berhasil dihapus." };
      }
    }
    return { success: false, error: "User tidak ditemukan." };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// ----------------------------------------------------
// API UNTUK FRONTEND
// ----------------------------------------------------

/**
 * Menarik semua data dari database
 */
function getAllData() {
  try {
    const sheet = getDbSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const result = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      let obj = {};
      for (let j = 0; j < headers.length; j++) {
        let cellVal = row[j];
        if (cellVal instanceof Date) {
          // Convert date to string to prevent google.script.run serialization error
          let d = cellVal;
          cellVal = d.getDate().toString().padStart(2, '0') + '-' + 
                    (d.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                    d.getFullYear() + ' ' +
                    d.getHours().toString().padStart(2, '0') + ':' +
                    d.getMinutes().toString().padStart(2, '0');
        }
        obj[headers[j]] = cellVal;
      }
      obj.rowNumber = i + 1; // menyimpan nomor baris untuk mempermudah update
      result.push(obj);
    }
    
    // Fetch Settings
    let settingsData = [];
    try {
      const settingsSheet = getSettingsSheet();
      const sData = settingsSheet.getDataRange().getValues();
      for (let i = 1; i < sData.length; i++) {
        if (sData[i][0]) {
          settingsData.push({ keyword: sData[i][0], color: sData[i][1] });
        }
      }
    } catch(err) {
      // ignore
    }
    // Fetch Stock Data
    let stockData = [];
    try {
      const stockRes = getAllStock();
      if(stockRes.success) stockData = stockRes.data;
    } catch(err) {}

    // Fetch Alokasi Data
    let alokasiData = [];
    try {
      const alokasiRes = getAllAlokasi();
      if(alokasiRes.success) alokasiData = alokasiRes.data;
    } catch(err) {}
    
    // Fetch Cabang Data
    let cabangData = [];
    try {
      const cabangSheet = getCabangSheet();
      const cData = cabangSheet.getDataRange().getValues();
      for (let i = 1; i < cData.length; i++) {
        if (cData[i][0]) {
          cabangData.push(cData[i][0]);
        }
      }
    } catch(err) {}
    
    return { success: true, data: result, settings: settingsData, stock: stockData, alokasi: alokasiData, cabang: cabangData };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Menyimpan pengaturan highlight
 */
function saveSettings(settingsArr) {
  try {
    const sheet = getSettingsSheet();
    // clear existing (except header)
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).clearContent();
    }
    
    let rows = [];
    for (let i = 0; i < settingsArr.length; i++) {
      if (settingsArr[i].keyword) {
        rows.push([String(settingsArr[i].keyword).trim(), settingsArr[i].color]);
      }
    }
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, 2).setValues(rows);
    }
    return { success: true };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Memproses data hasil upload Excel/CSV dari Frontend
 * payload format: { kategori: 'konfirmasi' | 'order_part' | 'siap_diambil', data: [ {Kode: ...}, ... ] }
 */
function processUploadedData(payload) {
  // Tambahkan Pengunci (LockService) untuk mencegah Race Condition
  const lock = LockService.getScriptLock();
  try {
    // Tunggu antrean maksimal 10 detik jika ada proses lain berjalan
    lock.waitLock(10000);
  } catch (e) {
    return { success: false, error: "Sistem sedang memproses data dari admin lain. Silakan coba 10 detik lagi." };
  }

  try {
    const sheet = getDbSheet();
    const existingData = sheet.getDataRange().getValues();
    const headers = existingData[0];
    
    // Pastikan Link_Kode ada di headers
    let headersChanged = false;
    if (!headers.includes("Link_Kode")) {
      headers.push("Link_Kode");
      headersChanged = true;
    }
    
    const kodeIndex = headers.indexOf("Kode");
    const statusIndex = headers.indexOf("Status");
    const closedIndex = headers.indexOf("Is_Closed");
    const katIndex = headers.indexOf("Kategori_File");
    const linkIndex = headers.indexOf("Link_Kode");
    
    // Buat map existing data berdasarkan "Kode" (menyimpan indeks baris dari existingData array, 0-based)
    const existingMap = {};
    for (let i = 1; i < existingData.length; i++) {
      let kode = existingData[i][kodeIndex];
      if (kode) {
        existingMap[kode] = {
          dataIndex: i,
          status: existingData[i][statusIndex],
          isClosed: existingData[i][closedIndex],
          kategoriFile: existingData[i][katIndex]
        };
      }
    }
    
    let addedCount = 0;
    let updatedCount = 0;
    let archivedCount = 0;
    const importedKodes = new Set();
    
    // Proses setiap baris data baru (modifikasi Array existingData langsung)
    payload.data.forEach(item => {
      let kode = item.Kode;
      if (!kode) return; // Skip jika tidak ada kode
      
      importedKodes.add(kode);
      let newStatus = item.Status || "";
      
      if (existingMap[kode]) {
        // Data sudah ada, update di memori array
        let i = existingMap[kode].dataIndex;
        let didUpdate = false;
        
        // Samakan panjang array baris jika diperlukan (khususnya jika ada kolom baru)
        while (existingData[i].length < headers.length) {
          existingData[i].push("");
        }
        
        // Buka kembali jika sebelumnya sudah di-closed
        if (existingMap[kode].isClosed === true || existingMap[kode].isClosed === 'true') {
           existingData[i][closedIndex] = false;
           existingData[i][katIndex] = payload.kategori;
           didUpdate = true;
        }
        
        let oldStatus = existingMap[kode].status;
        if (oldStatus !== newStatus && newStatus !== "") {
           existingData[i][statusIndex] = newStatus;
           existingData[i][katIndex] = payload.kategori;
           didUpdate = true;
        }
        
        // Cek Link_Kode
        if (item.Link_Kode) {
           let oldLink = existingData[i][linkIndex];
           if (oldLink !== item.Link_Kode) {
              existingData[i][linkIndex] = item.Link_Kode;
              didUpdate = true;
           }
        }
        
        if (didUpdate) updatedCount++;
        
      } else {
        // Data baru, buat array baris baru dan sesuaikan dengan header
        let newRow = [];
        for (let c = 0; c < headers.length; c++) {
          let h = headers[c];
          if (h === "Kategori_File") {
            newRow.push(payload.kategori);
          } else if (h === "Is_Closed") {
            newRow.push(false);
          } else {
            newRow.push(item[h] || ""); 
          }
        }
        existingData.push(newRow);
        addedCount++;
      }
    });
    
    // Auto-Archive Missing Data
    for (let kode in existingMap) {
      let existingItem = existingMap[kode];
      
      if (existingItem.kategoriFile === payload.kategori && (existingItem.isClosed === false || existingItem.isClosed === 'false')) {
        if (!importedKodes.has(kode)) {
          let i = existingItem.dataIndex;
          while (existingData[i].length < headers.length) existingData[i].push("");
          existingData[i][closedIndex] = true;
          archivedCount++;
        }
      }
    }
    
    // Pastikan SEMUA baris memiliki panjang yang sama persis dengan headers sebelum di setValues
    for (let i = 0; i < existingData.length; i++) {
       while (existingData[i].length < headers.length) {
          existingData[i].push("");
       }
    }
    
    // Bulk Update: Tuliskan kembali seluruh data ke Sheet sekaligus!
    sheet.getRange(1, 1, existingData.length, headers.length).setValues(existingData);
    
    return { success: true, message: `Berhasil memproses massal instan! Tambah: ${addedCount}, Update: ${updatedCount}, Arsip: ${archivedCount}.` };
  } catch (e) {
    return { success: false, error: e.toString() };
  } finally {
    // Pastikan lock dilepas baik berhasil maupun error
    lock.releaseLock();
  }
}

/**
 * Menandai data sebagai Selesai / Closed
 */
function markAsClosed(kode) {
  try {
    const sheet = getDbSheet();
    const data = sheet.getDataRange().getValues();
    const kodeIndex = data[0].indexOf("Kode");
    const closedIndex = data[0].indexOf("Is_Closed");
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][kodeIndex] === kode) {
        sheet.getRange(i + 1, closedIndex + 1).setValue(true);
        return { success: true, message: `Data ${kode} berhasil diselesaikan.` };
      }
    }
    return { success: false, error: "Data tidak ditemukan." };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Update Catatan Admin (misal dari tab Order Part: Kebutuhan Part, SN dll)
 */
function updateAdminNotes(kode, updates) {
   try {
    const sheet = getDbSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const kodeIndex = headers.indexOf("Kode");
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][kodeIndex] === kode) {
        
        // Loop tiap property yang ingin diupdate
        for (let key in updates) {
          let colIndex = headers.indexOf(key);
          if (colIndex === -1) {
             headers.push(key);
             colIndex = headers.length - 1;
             sheet.getRange(1, colIndex + 1).setValue(key);
          }
          sheet.getRange(i + 1, colIndex + 1).setValue(updates[key]);
        }
        return { success: true };
      }
    }
    return { success: false, error: "Data tidak ditemukan." };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Menghapus data permanen berdasarkan kode
 */
function deleteData(kode) {
  try {
    const sheet = getDbSheet();
    const data = sheet.getDataRange().getValues();
    const kodeIndex = data[0].indexOf("Kode");
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][kodeIndex] === kode) {
        sheet.deleteRow(i + 1);
        return { success: true, message: `Data ${kode} berhasil dihapus.` };
      }
    }
    return { success: false, error: "Data tidak ditemukan untuk dihapus." };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// ----------------------------------------------------
// FITUR ALOKASI & STOCK ACCURATE
// ----------------------------------------------------

function importStockData(dataArray) {
  try {
    const sheet = getStockSheet();
    // Bersihkan data lama (kecuali header)
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
    }
    
    // Masukkan data baru
    if (dataArray && dataArray.length > 0) {
      // dataArray format: [[SN, Nama, Kode], ...]
      sheet.getRange(2, 1, dataArray.length, dataArray[0].length).setValues(dataArray);
    }
    
    return { success: true };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

function getAllStock() {
  try {
    const sheet = getStockSheet();
    const data = sheet.getDataRange().getValues();
    const result = [];
    
    if (data.length > 1) {
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0]) {
          result.push({
            SN: row[0].toString(),
            Nama_Barang: row[1] ? row[1].toString() : "",
            Kode_Barang: row[2] ? row[2].toString() : ""
          });
        }
      }
    }
    return { success: true, data: result };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

function saveAlokasi(kodeTandaTerima, sn, namaBarang, tanggal, keterangan = "") {
  try {
    const sheet = getAlokasiSheet();
    sheet.appendRow([kodeTandaTerima, sn, namaBarang, tanggal, keterangan]);
    return { success: true };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

function saveAlokasiBatch(items) {
  try {
    const sheet = getAlokasiSheet();
    if (!items || items.length === 0) return { success: true };
    
    // items adalah array of objects: { Tanda_Terima, SN, Nama_Barang, Tanggal_Alokasi, Keterangan }
    const rows = items.map(item => [item.Tanda_Terima, item.SN, item.Nama_Barang, item.Tanggal_Alokasi, item.Keterangan || ""]);
    
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 5).setValues(rows);
    return { success: true };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

function getAllAlokasi() {
  try {
    const sheet = getAlokasiSheet();
    const data = sheet.getDataRange().getValues();
    const result = [];
    
    if (data.length > 1) {
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        let tandaTerima = row[0];
        let sn = row[1];
        let namaBarang = row[2];
        let tanggal = row[3];
        let keterangan = row[4];
        
        // Convert Date objects to string to prevent serialization error
        if (tandaTerima instanceof Date) tandaTerima = tandaTerima.toString();
        if (sn instanceof Date) sn = sn.toString();
        if (namaBarang instanceof Date) namaBarang = namaBarang.toString();
        if (tanggal instanceof Date) {
          tanggal = tanggal.getDate().toString().padStart(2, '0') + '-' + 
                    (tanggal.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                    tanggal.getFullYear();
        }
        
        result.push({
          Tanda_Terima: tandaTerima ? tandaTerima.toString() : "",
          SN: sn ? sn.toString() : "",
          Nama_Barang: namaBarang ? namaBarang.toString() : "",
          Tanggal_Alokasi: tanggal ? tanggal.toString() : "",
          Keterangan: keterangan ? keterangan.toString() : ""
        });
      }
    }
    return { success: true, data: result };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

function clearArsipData() {
  try {
    const sheet = getDbSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return { success: true, message: "Tidak ada data untuk dihapus." };
    
    const headers = data[0];
    const isClosedIndex = headers.indexOf("Is_Closed");
    
    if (isClosedIndex === -1) {
       return { success: false, error: "Kolom Is_Closed tidak ditemukan." };
    }
    
    // Filter data: simpan header dan baris yang BUKAN arsip
    const remainingData = data.filter((row, index) => {
      if (index === 0) return true; // keep header
      const isClosedVal = row[isClosedIndex];
      return !(isClosedVal === true || isClosedVal === 'true' || isClosedVal === 'TRUE');
    });
    
    if (remainingData.length === data.length) {
      return { success: true, message: "Tidak ada data arsip yang dihapus." };
    }
    
    // Kosongkan dan tulis ulang data yang tersisa
    sheet.clearContents();
    if (remainingData.length > 0) {
      sheet.getRange(1, 1, remainingData.length, remainingData[0].length).setValues(remainingData);
    }
    
    // Hapus baris kosong berlebih di bawah untuk mengurangi ukuran sheet
    const totalRows = sheet.getMaxRows();
    if (totalRows > remainingData.length) {
      sheet.deleteRows(remainingData.length + 1, totalRows - remainingData.length);
    }
    
    const countDeleted = data.length - remainingData.length;
    return { success: true, message: `Berhasil menghapus ${countDeleted} data arsip selesai.` };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

