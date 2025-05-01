"use strict";

const fs = require("fs");
const { exec } = require("child_process");

const projectPath = __dirname + "/..";
const buildPath = projectPath + "/build";

const protoDirPath = buildPath + "/Bitrix/Pull/Protobuf";
const gpbMetaDirPath = buildPath + "/GPBMetadata";

if (!fs.existsSync(buildPath))
{
	fs.mkdirSync(buildPath);
}

deleteFolderRecursive(protoDirPath);
deleteFolderRecursive(gpbMetaDirPath);

const child = exec(
	"protoc " +
		"--proto_path=./lib/models/ " +
		"--php_out=build " +
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

		patchFiles(protoDirPath);
		patchFiles(gpbMetaDirPath);

		makeLowerCase(protoDirPath);
		makeLowerCase(gpbMetaDirPath);

		fs.renameSync(gpbMetaDirPath, protoDirPath + "/gpbmetadata");
	}
);

function patchFiles(path)
{
	const files = fs.readdirSync(path);
	files.forEach(function(file) {

		if (file === "." || file === "..")
		{
			return;
		}

		const filePath = path + "/" + file;

		let content = fs.readFileSync(filePath).toString();

		content = content.replace(new RegExp("namespace GPBMetadata;", "g"), "namespace Bitrix\\Pull\\Protobuf\\GPBMetadata;");
		content = content.replace(new RegExp("\\\\GPBMetadata\\\\", "g"), "\\Bitrix\\Pull\\Protobuf\\GPBMetadata\\");

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


function deleteFolderRecursive(path)
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

	fs.rmdirSync(path);
}