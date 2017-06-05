var fs = require('fs');
var xml2js = require('xml2js');

var excelBuilder = require('node-xlsx').default;
var parser = new xml2js.Parser();
var bulider = new xml2js.Builder();

function FileConfig(transCode, type) {
    this.transCode = transCode;
    this.type = type;
}

/**
 *找到对应文件并读取
 * @param {{transCode:string,type:string}} fileConfig
 */
function findFile(fileConfig) {
    var regex = new RegExp(`_` + fileConfig.transCode + `_` + fileConfig.type);
    var files = fs.readdirSync('./file');
    var file = files.find(elem => regex.test(elem));
    return fs.readFileSync(`./file/` + file, 'utf8');
}

function writeHeader() {

}

var fileConfig = new FileConfig('0610', 'req');
var fileContent = findFile(fileConfig);
var model = [];
parser.parseString(fileContent, (err, result) => {
    model = result['picxp:PICXPModel'].fields;
});
