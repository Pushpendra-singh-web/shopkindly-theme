var config = {
    paths: {
        slick: 'js/slick.min'
    },
    shim: {
        slick: {
            deps: ['jquery']
        }
    },
    config: {
        mixins: {
            'Magento_Checkout/js/view/summary/abstract-total': {
                'Magento_Checkout/js/abstract-total-mixin': true
            },
            'Magento_Checkout/js/model/checkout-data-resolver': {
                'Magento_Checkout/js/model/checkout-data-resolver-mixin': true
            }
        }
    },
};
