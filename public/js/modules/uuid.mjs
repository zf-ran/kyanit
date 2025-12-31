export function generateUUID() {
	if (typeof crypto !== 'undefined' && crypto.randomUUID)
		return crypto.randomUUID();

	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, char => {
		const r = Math.random() * 16 | 0;
		const v = char === "x" ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}