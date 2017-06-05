var fs = require('fs');
var xml2js = require('xml2js');

var excelBuilder = require('node-xlsx').default;
var parser = new xml2js.Parser();

/**
 *文件配置
 * @constructor
 * @param {string} fileName 文件名
 */
function FileConfig(fileName) {
    this.fileName = fileName;
    var patten = /_\d*_/;
    this.transCode = patten.exec(fileName).shift().replace('_', "").replace('_', "");
    patten = /_\d*_[a-z]*/;
    var pattenT = /[a-z]*$/;
    this.type = patten.exec(fileName).shift();
    this.type = pattenT.exec(this.type).shift();
    if (this.type == 'req') {
        this.cnType = '请求';
    }
    else if (this.type == 'resp') {
        this.cnType = '返回';
    }
    else if (this.type == 'mx') {
        this.type = 'resp';
        this.cnType = '返回';
    }
    this.name = '';
}

/**
 *找到对应文件并读取
 * @param {{transCode:string,type:string}} fileConfig
 */
function findFile(fileConfig) {
    return fs.readFileSync(`./file/` + fileConfig.fileName, 'utf8');
}

function ExcelModel() {
    this.name = '';
    this.data = [];
}

function writeHeader() {
    var excelModel = new ExcelModel();
    excelModel.name = '交易接口';
    excelModel.data = [['交易代码', '交易名称', '类型']];
    return excelModel;
}

function getSameInterface(file) {
    var fileConfig = new FileConfig(file);
    var fileConfigs = [];
    fileConfigs.push(fileConfig);
    patten = new RegExp(`_` + fileConfig.transCode + '_');
    var sameFileConfigs = files.filter(elem => patten.test(elem));
    sameFileConfigs.forEach(elem => {
        fileConfigs.push(new FileConfig(elem));
        var index = files.indexOf(elem);
        files.splice(index, 1);
    });
    return fileConfigs;
}

function writeBody(fileConfig) {
    var excelModel = new ExcelModel();
    var patten = /mx/;
    excelModel.name = fileConfig.transCode + '_' + fileConfig.cnType;
    excelModel.data = [['字段名', '字段长度', '字段中文名', '备注']];
    if (patten.test(fileConfig.fileName)) {
        fileConfig.cnType += '循环体';
        excelModel.name += '循环体';
    }

    return excelModel;
}

var files = fs.readdirSync(`./file`);
var excelModels = [];
var headerModel = writeHeader();

while (files.length != 0) {
    var file = files.shift();
    var fileConfigs = getSameInterface(file);
    fileConfigs.forEach(fileConfig => {
        var bodyModel = writeBody(fileConfig);
        var fileContent = findFile(fileConfig);
        var models = [];
        parser.parseString(fileContent, (err, result) => {
            models = result['picxp:PICXPModel'].fields;
            fileConfig.name = result['picxp:PICXPModel'].basicmodel[0].$.note;
        });
        headerModel.data.push([fileConfig.transCode, fileConfig.name, fileConfig.cnType]);
        models.forEach(model => {
            if (model.$.fldref) {
                var fieldName = model.$.fldref;
                var patten = /.*[\u4e00-\u9fa5]/;
                var fieldNote = patten.exec(model.$.note);
                var fieldLength = model.$.tranlen;
                bodyModel.data.push([fieldName, fieldLength, fieldNote]);
            }
        });
        excelModels.push(bodyModel);
    })
}
excelModels.push(headerModel);

var buffer = excelBuilder.build(excelModels);
fs.writeFileSync(`./interface/result.xlsx`, buffer);
console.log(buffer);