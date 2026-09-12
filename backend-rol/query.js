
const db = require('./config/db');
db.query(process.argv[2], (err, results) => {
    if (err) console.error(err);
    else console.log(results);
    process.exit(0);
});
