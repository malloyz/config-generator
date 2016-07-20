/**
 * Created by malloyzhu on 2015/12/21.
 */
var fs = require('fs');
var path = require("path");
var xlsx = require('node-xlsx');
var util = require("../util/Util.js");

var fileStorePath = process.argv[2];
var xlsxRootPath = process.argv[3];
var configArg = process.argv[4];

var minRow = 2;
var currentDir = __dirname;
var configRootPath = path.join(fileStorePath, 'config/');
var configObjectRootPath = path.join(fileStorePath, 'configObject/');
var structureCodeTemplatePath = path.join(currentDir, 'lib/StructureTemplate.js');
var getSetCodeTemplatePath = path.join(currentDir, 'lib/GetSetTemplate.js');

var excleName = null;
var xlsFileList = [];
var structureCodeTemplate = null;
var getSetCodeTemplate = null;

function initCodeTemplate() {
    try {
        structureCodeTemplate = fs.readFileSync(structureCodeTemplatePath, "utf-8");
        getSetCodeTemplate = fs.readFileSync(getSetCodeTemplatePath, "utf-8");
    }
    catch (e) {
        console.log(e);
    }
};

function generatorConfigObjectCodeFile(excelFilePath) {
    var result = excelFilePath.split(path.sep);
    result = result[result.length - 1].split(".");
    excleName = result[0];
    var sheetDatas = xlsx.parse(excelFilePath);
    for (var i in sheetDatas) {
        var sheetData = sheetDatas[i];
        handleSheet(sheetData);
    }
};

function handleSheet(sheetData) {
    if (sheetData.data.length >= (minRow - 1)) {
        if (configArg == 'configObject') {
            var code = generatorConfigObjectCode(sheetData);
            writeConfigObjectCodeFile(sheetData.name, code);
        }
        var configData = getSheetConfigData(sheetData);
        writeConfigFile(excleName + '_' + sheetData.name, 'var ' + excleName + '_' + sheetData.name + ' = ' + JSON.stringify(configData, null, 4) + ";");
    }
};

function getSheetConfigData(sheetData) {
    var data = [];
    for (var row = 3; row < sheetData.data.length; row++) {
        var rowData = {};
        var cols = sheetData.data[row];
        for (var col = 0; col < cols.length; col++) {
            var fieldName = sheetData.data[0][col];
            var fieldValue = sheetData.data[row][col];
            rowData[fieldName] = fieldValue;
        }
        data.push(rowData);
    }
    return data;
};

function writeConfigFile(sheetName, sheetData) {
    try {
        var codeFilePath = path.join(configRootPath, util.upperFirstLetter(sheetName)) + ".js";
        fs.writeFileSync(codeFilePath, sheetData);
        console.log("生成 " + util.upperFirstLetter(sheetName) + ".js" + " 成功");
    }
    catch (e) {
        console.log(e);
    }
};

function writeConfigObjectCodeFile(sheetName, code) {
    try {
        var codeFilePath = path.join(configObjectRootPath, util.upperFirstLetter(sheetName)) + "ConfigObject.js";
        fs.writeFileSync(codeFilePath, code);
        console.log("生成 " + util.upperFirstLetter(sheetName) + "ConfigObject.js" + " 成功");
    }
    catch (e) {
        console.log(e);
    }
};

/**
 * 生成配置对象代码
 * @param sheetData：工作表数据
 */
function generatorConfigObjectCode(sheetData) {
    var ruleList = [{regular: "&.*?&", replaceString: util.getFullDate()}, {
        regular: "#.*?#",
        replaceString: util.upperFirstLetter(sheetData.name) + "ConfigObject"
    }, {
        regular: "%.*?%",
        replaceString: util.getUserName()
    }];

    var code = util.replaceCodeTemplateString(ruleList, structureCodeTemplate);
    code = code.replace(/\n+$/g, "");//去掉最后的换行符

    var fieldData = sheetData.data[0];//字段数据
    var fieldTypeData = sheetData.data[1];//字段类型数据
    var noteData = sheetData.data[2];//注释数据

    //遍历列
    for (var j = 0; j < fieldData.length; j++) {
        code += "\n\n";
        var field = fieldData[j];//将首字母置为大写
        var letterField = util.upperFirstLetter(fieldData[j]);//将首字母置为大写
        var fieldType = fieldTypeData[j];
        var note = noteData[j];
        var ruleList = [{regular: "#.*?#", replaceString: note}, {
            regular: "&.*?&",
            replaceString: letterField
        }, {regular: "%.*?%", replaceString: field}, {regular: "@.*?@", replaceString: fieldType}];
        var getSetCode = util.replaceCodeTemplateString(ruleList, getSetCodeTemplate);
        getSetCode = getSetCode.replace(/\n+$/g, "");
        getSetCode += ",";
        code += getSetCode;
    }

    code = code.replace(/,+$/g, "");
    code += "\n";
    code += "});";

    return code;
};

function initXlsFileList() {
    travel(xlsxRootPath, function (pathName) {
        xlsFileList.push(pathName);
    });
};

function travel(dir, callback) {
    var files = fs.readdirSync(dir);
    for (var i in files) {
        var file = files[i];
        var pathName = path.join(dir, file);
        if (fs.statSync(pathName).isDirectory()) {
            travel(pathName, callback);
        } else {
            var ext = path.extname(pathName);
            if (ext === ".xlsx" || ext === ".xls") {
                callback(pathName);
            }
        }
    }
};

function deleteOldFile() {
    deleteFolderRecursive(configObjectRootPath);
    deleteFolderRecursive(configRootPath);
};

function deleteFolderRecursive(dir) {
    if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach(function (file, index) {
            var curPath = path.join(dir, file);
            if (fs.statSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath, fs);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(dir);
        return true;
    }
    return false;
};

function makeDir() {
    fs.mkdir(configRootPath, 0777, function (err) {
        if (err) throw err;
    });

    if (configArg == 'configObject') {
        fs.mkdir(configObjectRootPath, 0777, function (err) {
            if (err) throw err;
        });
    }
};

if (module == require.main) {
    initCodeTemplate();
    initXlsFileList();
    deleteOldFile();
    makeDir();
    for (var i in xlsFileList) {
        generatorConfigObjectCodeFile(xlsFileList[i]);
    }
};
