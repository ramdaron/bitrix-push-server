"use strict";

const fs = require("fs");
const { exec } = require("child_process");

const projectPath = __dirname + "/..";
const buildPath = projectPath + "/build";

deleteFolderRecursive(buildPath, false);

if (!fs.existsSync(buildPath))
{
	fs.mkdirSync(buildPath);
}

const child = exec(
	"protoc " +
		"--proto_path=./lib/models/ " +
		"--plugin=protoc-gen-custom=./vendor/bin/protobuf " +
		"--custom_out=./build/ " +
		"./lib/models/request.proto " +
		"./lib/models/response.proto " +
		"./lib/models/receiver.proto " +
		"./lib/models/sender.proto",
	{
		cwd: projectPath
	},
	(error, stdout, stderr) => {
		if (error)
		{
			throw error;
		}

		patchFiles(buildPath);
		makeLowerCase(buildPath);

	}
);

function patchFiles(path)
{
	let files = fs.readdirSync(path);
	files = files.filter(file => file !== "." && file !== "..");

	const classes = files.map(file => file.substr(0, file.length - 4));

	files.forEach(function(file) {

		const filePath = path + "/" + file;

		let content = fs.readFileSync(filePath).toString();

		content = content.replace(new RegExp("\\\\(" + classes.join("|") + ")", "g"), "\\Bitrix\\Pull\\Protobuf\\$1");
		content = content.replace(new RegExp("<\\?php"), "<?\n\n" + "namespace Bitrix\\Pull\\Protobuf;\n");

		fs.writeFileSync(filePath, content);
	});
}

function makeLowerCase(path)
{
	const files = fs.readdirSync(path);
	files.forEach(function(file) {

		if (file === "." || file === "...")
		{
			return;
		}

		fs.renameSync(path + "/" + file, path + "/" + file.toLowerCase());
	});
}


function deleteFolderRecursive(path, suicide)
{
	if (!fs.existsSync(path) || path === "/")
	{
		return;
	}

	fs.readdirSync(path).forEach(function(file) {
		const curPath = path + "/" + file;
		if (fs.lstatSync(curPath).isDirectory())
		{
			deleteFolderRecursive(curPath);
		}
		else
		{
			fs.unlinkSync(curPath);
		}
	});

	if (suicide !== false)
	{
		fs.rmdirSync(path);
	}
}