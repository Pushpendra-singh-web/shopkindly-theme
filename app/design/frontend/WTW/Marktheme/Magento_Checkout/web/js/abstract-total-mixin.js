define([], function () {
    "use strict";

    return function (target) {
        return target.extend({
            /**
             * @return {*}
             */
            isFullMode: function () {
                if (!this.getTotals()) {
                    return false;
                }

                return true;
            }
        });
    }
});