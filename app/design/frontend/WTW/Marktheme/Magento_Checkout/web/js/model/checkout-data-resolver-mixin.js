define([
    'Magento_Customer/js/model/address-list',
    'Magento_Checkout/js/model/quote',
    'Magento_Checkout/js/checkout-data',
    'Magento_Checkout/js/action/create-shipping-address',
    'Magento_Checkout/js/action/select-shipping-address',
    'Magento_Checkout/js/action/select-shipping-method',
    'Magento_Checkout/js/model/payment-service',
    'Magento_Checkout/js/action/select-payment-method',
    'Magento_Checkout/js/model/address-converter',
    'Magento_Checkout/js/action/select-billing-address',
    'Magento_Checkout/js/action/create-billing-address',
    'underscore'
], function (
    addressList,
    quote,
    checkoutData,
    createShippingAddress,
    selectShippingAddress,
    selectShippingMethodAction,
    paymentService,
    selectPaymentMethodAction,
    addressConverter,
    selectBillingAddress,
    createBillingAddress,
    _
) {
        'use strict';
        return function (target) {
            /**
	         * @param {Object} ratesData
	         */
	        target.resolveShippingRates = function (ratesData) {
	            var selectedShippingRate = checkoutData.getSelectedShippingRate(),
	                availableRate = false;

	            if (ratesData.length === 1) {
	                //set shipping rate if we have only one available shipping rate
	                //commented to not to set default rate if it is only 1
	                //selectShippingMethodAction(ratesData[0]);

	                //return;
	            }

	            if (quote.shippingMethod()) {
	                availableRate = _.find(ratesData, function (rate) {
	                    return rate['carrier_code'] == quote.shippingMethod()['carrier_code'] && //eslint-disable-line
	                        rate['method_code'] == quote.shippingMethod()['method_code']; //eslint-disable-line eqeqeq
	                });
	            }

	            if (!availableRate && selectedShippingRate) {
	                availableRate = _.find(ratesData, function (rate) {
	                    return rate['carrier_code'] + '_' + rate['method_code'] === selectedShippingRate;
	                });
	            }

	            if (!availableRate && window.checkoutConfig.selectedShippingMethod) {
	                availableRate = window.checkoutConfig.selectedShippingMethod;
	                selectShippingMethodAction(window.checkoutConfig.selectedShippingMethod);

	                return;
	            }

	            //Unset selected shipping method if not available
	            if (!availableRate) {
	                selectShippingMethodAction(null);
	            } else {
	                selectShippingMethodAction(availableRate);
	            }
	        };
            return target;
        }
    }
);