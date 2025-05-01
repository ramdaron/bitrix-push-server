const MySql = require("../lib/storages/mysql");
const Sqlite = require("../lib/storages/sqlite");
const argv = require("minimist")(process.argv.slice(2));
const os = require('os');
const hostname = typeof(argv.hostname) === 'string' ? argv.hostname : os.hostname().split('.')[0];

(async () => {
	const mysql = await MySql.getDatabase();
	const sqlite = Sqlite.getDatabase();

	let errors = 0;
	let successes = 0;
	const statement = sqlite.prepare('SELECT * from licenses ORDER BY id');
	for (const license of statement.iterate())
	{
		const sql = `
			INSERT INTO licenses 
			(clientId, host, securityKey, securityAlgo, dateTo, siteUrl, verificationQuery, lastCheck)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`;

		mysql.query(
			sql,
			[
				license.clientId,
				hostname,
				license.securityKey,
				license.securityAlgo,
				license.dateTo,
				license.siteUrl,
				license.verificationQuery,
				license.lastCheck,
			],
			(error) => {
				if (error)
				{
					errors++;
				}
				else
				{
					successes++;
				}
			}
		);
	}

	mysql.query('SELECT COUNT(*) as cnt FROM licenses', (error, results) => {
		console.log(`Hostname: ${hostname}. All licenses: ${results[0]['cnt']}. Processed Rows: ${successes}. Errors: ${errors}`);
	});

	mysql.end();
})();

