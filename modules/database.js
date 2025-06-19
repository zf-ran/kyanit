const path = require('path');
const fs = require('fs');

const db = {
	path: path.join(__dirname, '.data', 'database.json'),
	indentation: parseInt(process.env.DATABASE_INDENTATION),
	encoding: 'utf8',
	async getAll() {
		let values = JSON.parse(await fs.readFileSync(this.path, { encoding: this.encoding }));

		return values;
	},
	async set(key, value) {
		let database = await this.getAll();
		database[key] = value;

		await fs.writeFileSync(this.path, JSON.stringify(database, null, this.indentation), { encoding: this.encoding });
	},
	async get(key) {
		const database = await this.getAll();
		let value = database[key];
		return value;
	},
	async remove(key) {
		const database = await this.getAll();
		delete database[key];

		await fs.writeFileSync(this.path, JSON.stringify(database, null, this.indentation), { encoding: this.encoding });
	},
	async reset() {
		await fs.writeFileSync(this.path, '{}', { encoding: this.encoding });
	}
};

module.exports = db;