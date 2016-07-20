/**
 * Created by %userName% on &date&
 */

var #FileName# = cc.Class.extend({
    _config: null,

    ctor: function (config) {
        this._config = config;
    },

    /**
     * 获取配置
     * @returns {object}
     */
    getConfig: function () {
        return this._config;
    },
