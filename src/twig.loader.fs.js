module.exports = function(Twig) {
    'use strict';

    var fs, path;

    try {
    	// require lib dependencies at runtime
    	fs = require('fs');
    	path = require('path');
    } catch (e) {
    	// NOTE: this is in a try/catch to avoid errors cross platform
    }

    Twig.Templates.registerLoader('fs', function(location, params, callback, error_callback) {
        var template,
            data = null,
            precompiled = params.precompiled,
            parser = this.parsers[params.parser] || this.parser.twig;

        if (!fs || !path) {
            throw new Twig.Error('Unsupported platform: Unable to load from file ' +
                                 'because there is no "fs" or "path" implementation');
        }

        var loadTemplateFn = function(err, data) {
            if (err) {
                if (typeof error_callback === 'function') {
                    error_callback(err);
                }
                return;
            }

            if (precompiled === true) {
                data = JSON.parse(data);
            }

            if (Twig.functions.remoteTemplateIdResolver) {
                params.id = Twig._function('remoteTemplateIdResolver', params.id);
            }

            params.data = data;
            params.path = params.path || location;

            // template is in data
            template = parser.call(this, params);

            if (typeof callback === 'function') {
                callback(template);
            }
        };
        params.path = params.path || location;

        if (params.async) {
            fs.stat(params.path, function (err, stats) {
                if (err || !stats.isFile()) {
                    throw new Twig.Error('Unable to find template file ' + location);
                }
                fs.readFile(params.path, 'utf8', loadTemplateFn);
            });
            // TODO: return deferred promise
            return true;
        } else {
            if (!fs.statSync(params.path).isFile()) {
                throw new Twig.Error('Unable to find template file ' + location);
            }
            data = fs.readFileSync(params.path, 'utf8');
            loadTemplateFn(undefined, data);
            return template
        }
    });

};
