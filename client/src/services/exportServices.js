/**
 * Converts an array of objects to a CSV string.
 * @param {Array<object>} data - The data to convert.
 * @param {Array<string>} columns - The column headers.
 * @returns {string} The CSV formatted string.
 */
const toCsv = (data, columns) => {
    const header = columns.join(',') + '\n';
    const body = data.map(row => 
        columns.map(col => `"${row[col]?.toString().replace(/"/g, '""') || ''}"`).join(',')
    ).join('\n');
    return header + body;
};

/**
 * Triggers a browser download for the given content.
 * @param {string} content - The content to download.
 * @param {string} fileName - The name of the file.
 * @param {string} contentType - The MIME type of the file.
 */
const download = (content, fileName, contentType) => {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
};

// --- Public Export Functions ---

export const exportToCsv = (data, columns, fileName) => {
    const csvContent = toCsv(data, columns);
    download(csvContent, fileName, 'text/csv;charset=utf-8;');
};

export const exportToJson = (data, fileName) => {
    const jsonContent = JSON.stringify(data, null, 2);
    download(jsonContent, fileName, 'application/json');
};

export const copyToMarkdown = (data, columns) => {
    const header = `| ${columns.join(' | ')} |\n`;
    const separator = `| ${columns.map(() => '---').join(' | ')} |\n`;
    const body = data.map(row => 
        `| ${columns.map(col => row[col] || '').join(' | ')} |`
    ).join('\n');
    navigator.clipboard.writeText(header + separator + body);
};