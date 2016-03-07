'use strict';

const BaseBuilder = require('./base-builder');

module.exports = class CssBuilder extends BaseBuilder {
    build() {
        return Promise.resolve();
    }
};
