'use strict';

const fs = require('fs-extra');

exports.ensureDirSync = fs.ensureDirSync.bind(fs);
exports.ensureDir = dir => {
    return new Promise((resolve, reject) => {
        fs.ensureDir(dir, err => err ? reject(err) : resolve());
    });
};

exports.ensureFileSync = fs.ensureFileSync.bind(fs);
exports.ensureFile = file => {
    return new Promise((resolve, reject) => {
        fs.ensureFile(file, err => err ? reject(err) : resolve());
    });
};

exports.readFileSync = fs.readFileSync.bind(fs);
exports.readFile = (file, opts) => {
    opts = opts || {};
    return new Promise((resolve, reject) => {
        fs.readFile(file, opts, (err, res) => err ? reject(err) : resolve(res));
    });
};

exports.readJsonSync = fs.readJsonSync.bind(fs);
exports.readJson = file => {
    return new Promise((resolve, reject) => {
        fs.readJson(file, (err, obj) => err ? reject(err) : resolve(obj));
    });
};

exports.removeSync = fs.removeSync.bind(fs);
exports.remove = dir => {
    return new Promise((resolve, reject) => {
        fs.remove(dir, err => err ? reject(err) : resolve());
    });
};

exports.statSync = fs.statSync.bind(fs);
exports.stat = path => {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, stat) => err ? reject(err) : resolve(stat));
    });
};

exports.statSafeSync = path => {
    let stat = null;
    try { stat = fs.statSync(path); }
    catch (e) { /* EMPTY */ }
    return stat;
};
exports.statSafe = path => {
    return new Promise(resolve => {
        fs.stat(path, (err, stat) => resolve(err ? null : stat));
    });
};

exports.writeFileSync = fs.writeFileSync.bind(fs);
exports.writeFile = (file, contents, opts) => {
    opts = opts || {};
    return new Promise((resolve, reject) => {
        fs.writeFile(file, contents, opts, err => err ? reject(err) : resolve());
    });
};

exports.writeJsonSync = fs.writeJsonSync.bind(fs);
exports.writeJson = (file, obj) => {
    return new Promise((resolve, reject) => {
        fs.writeJson(file, obj, err => err ? reject(err) : resolve());
    });
};
