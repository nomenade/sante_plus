const fs = require('fs');
const p = 'd:\\apk_sante\\frontend\\src\\components\\Auth.jsx';
let lines = fs.readFileSync(p, 'utf8').split('\n');
lines[55] = '      } else {';
lines[165] = '            <button type="submit" className="auth-submit" disabled={loading}>';
fs.writeFileSync(p, lines.join('\n'));
console.log('Correction OK');
