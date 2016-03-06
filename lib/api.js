const path = require('path');
const Venderast = require('./lib/venderast');

module.exports = function(config) {
	if (!config) {
        try { config = require(path.join(process.cwd(), 'venderast')); }
        catch (e) { throw Error('Config is not provided'); }
	}

    const venderast = new Venderast(config);

    const api_default = venderast.all.bind(venderast);
	
	api_default.obj = venderast;

	return api_default;
};
