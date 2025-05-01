module.exports = {
	"env": {
		"es6": true,
		"node": true
	},
	"extends": "eslint:recommended",
	"rules": {
		"no-console": 0,
		"no-unused-vars": 0,
		"indent": [
			"error",
			"tab",
			{ "SwitchCase": 1 }
		],
		"linebreak-style": [
			"error",
			"unix"
		],
		"quotes": [
			"error",
			"double"
		],
		"semi": [
			"error",
			"always"
		]
	}
};