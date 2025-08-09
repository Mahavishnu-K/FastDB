// A very simple mock data generator. For real use, a library like Faker.js would be better.
const generateRandomString = (len) => (Math.random() + 1).toString(36).substring(2, len + 2);
const generateRandomInt = (max) => Math.floor(Math.random() * max);
const generateRandomDate = () => new Date(Date.now() - generateRandomInt(1e10)).toISOString().split('T')[0];
const generateRandomBool = () => Math.random() > 0.5;

const generateRowData = (columns) => {
    const row = {};
    columns.forEach(col => {
        const type = col.type.toUpperCase();
        if (type.includes('SERIAL') || col.primaryKey) {
            row[col.name] = null; // Let the DB handle it
            return;
        }
        if (type.includes('VARCHAR') || type.includes('TEXT')) {
            row[col.name] = generateRandomString(10);
        } else if (type.includes('INT')) {
            row[col.name] = generateRandomInt(10000);
        } else if (type.includes('BOOL')) {
            row[col.name] = generateRandomBool();
        } else if (type.includes('DATE') || type.includes('TIMESTAMP')) {
            row[col.name] = generateRandomDate();
        } else if (type.includes('REAL') || type.includes('NUMERIC')) {
            row[col.name] = (Math.random() * 1000).toFixed(2);
        } else {
            row[col.name] = null;
        }
    });
    return row;
};

export const generateMockSql = (tableName, columns, rowCount) => {
    const insertableColumns = columns.filter(c => !c.type.toUpperCase().includes('SERIAL') && !c.primaryKey);
    const colNames = insertableColumns.map(c => `"${c.name}"`).join(', ');

    let sql = `INSERT INTO "${tableName}" (${colNames})\nVALUES\n`;
    
    const rows = [];
    for (let i = 0; i < rowCount; i++) {
        const rowData = generateRowData(columns);
        const values = insertableColumns.map(c => {
            const val = rowData[c.name];
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (val === null) return 'NULL';
            return val;
        }).join(', ');
        rows.push(`    (${values})`);
    }

    sql += rows.join(',\n') + ';';
    return sql;
};