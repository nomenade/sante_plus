const fs = require('fs');
const p = 'd:/apk_sante/frontend/src/components/DashboardHome.jsx';
let c = fs.readFileSync(p, 'utf8');
const f = c.split('\n');

const oldStart = f.indexOf('// Heure du PROCHAIN rappel de prise (ex. « 12:30 ») — vraie donnée de la liste.');
if (oldStart === -1) {
  console.log('Ancien bloc déjà supprimé.');
} else {
  const oldFuncLine = f.indexOf('function nextReminderTime() {', oldStart);
  const tipLine = f.indexOf('const TIP_OF_DAY = {', oldFuncLine);
  console.log('Ancien bloc : lignes', oldStart+1, 'à', tipLine);
  console.log('Ligne avant :', JSON.stringify(f[oldStart-1]));
  console.log('Ligne TIP :', JSON.stringify(f[tipLine]));
  console.log('Ligne avant TIP (blanc) ?:', JSON.stringify(f[tipLine-1]));
}
