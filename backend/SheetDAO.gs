/**
 * ============================================================================
 * SUPPORTDESK CRM — GENERIC SHEET DATA ACCESS OBJECT
 * Provides CRUD operations on any Google Sheet using header-based mapping.
 * Optimised with batch reads/writes to minimise Sheets API calls.
 * ============================================================================
 */
class SheetDAO {
  /**
   * @param {string} sheetName - Tab name in the spreadsheet.
   * @param {string[]} headers - Ordered column names (must match row 1).
   */
  constructor(sheetName, headers) {
    this.sheetName = sheetName;
    this.headers = headers;
    try {
      this.ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    } catch(err) {
      this.ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    }
    this.sheet = this.ss.getSheetByName(sheetName);
    if (!this.sheet) throw new Error('Sheet "' + sheetName + '" not found. Run seedAllData() first.');
  }

  // ---------------------------------------------------------------------------
  // READ
  // ---------------------------------------------------------------------------

  /** Returns every row (excluding header) as an array of objects. */
  getAll() {
    const range = this.sheet.getDataRange();
    const rows = range.getValues();
    if (rows.length <= 1) return [];
    return this._mapRows(rows.slice(1));
  }

  /** Finds a single row by primary key (first column by default). */
  findById(id, idColIdx) {
    idColIdx = idColIdx || 0;
    const rows = this.getAll();
    const key = this.headers[idColIdx];
    return rows.find(function (r) { return String(r[key]) === String(id); }) || null;
  }

  /** Finds all rows matching a predicate function. */
  findWhere(predicateFn) {
    return this.getAll().filter(predicateFn);
  }

  // ---------------------------------------------------------------------------
  // WRITE
  // ---------------------------------------------------------------------------

  /**
   * Inserts a new row.
   * @param {Object} obj  — key/value pairs matching header names.
   * @param {boolean} prepend — if true, inserts after header row; otherwise appends.
   */
  insert(obj, prepend) {
    const rowData = this._toRow(obj);
    if (prepend) {
      this.sheet.insertRowAfter(1);
      this.sheet.getRange(2, 1, 1, rowData.length).setValues([rowData]);
    } else {
      this.sheet.appendRow(rowData);
    }
    return obj;
  }

  /**
   * Inserts multiple rows at the end of the sheet.
   * @param {Object[]} objs - array of objects matching header names.
   */
  insertMany(objs) {
    if (!objs || objs.length === 0) return objs;
    const rowDataList = objs.map(this._toRow.bind(this));
    const lastRow = this.sheet.getLastRow();
    this.sheet.getRange(lastRow + 1, 1, rowDataList.length, this.headers.length).setValues(rowDataList);
    return objs;
  }

  /**
   * Updates an existing row identified by primary key.
   * @param {string} id - Value to match.
   * @param {Object} updates - Fields to merge.
   * @param {number} idColIdx - Column index of the key (default 0).
   */
  update(id, updates, idColIdx) {
    idColIdx = idColIdx || 0;
    const rows = this.sheet.getDataRange().getValues();

    var sheetRow = -1;
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][idColIdx]) === String(id)) {
        sheetRow = i + 1; // 1-indexed
        break;
      }
    }
    if (sheetRow === -1) throw new Error('Record "' + id + '" not found in ' + this.sheetName);

    var existing = this._mapRows([rows[sheetRow - 1]])[0];
    var merged = {};
    for (var k in existing) merged[k] = existing[k];
    for (var k2 in updates) merged[k2] = updates[k2];

    var rowData = this._toRow(merged);
    this.sheet.getRange(sheetRow, 1, 1, rowData.length).setValues([rowData]);
    return merged;
  }

  /**
   * Deletes a row by primary key.
   */
  deleteById(id, idColIdx) {
    idColIdx = idColIdx || 0;
    var rows = this.sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][idColIdx]) === String(id)) {
        this.sheet.deleteRow(i + 1);
        return true;
      }
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------
  _mapRows(rows) {
    var headers = this.headers;
    return rows.map(function (row) {
      var obj = {};
      headers.forEach(function (h, idx) {
        obj[h] = row[idx] !== undefined ? row[idx] : '';
      });
      return obj;
    });
  }

  _toRow(obj) {
    return this.headers.map(function (h) {
      return obj[h] !== undefined ? obj[h] : '';
    });
  }
}
