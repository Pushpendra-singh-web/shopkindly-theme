define([
    'jquery',
    'jquery/ui'
], function ($) {
    'use strict';

    var searchClick = {
        url: null,
        selectorSearchPageLink: '.catalogsearch-result-index .search.results .product-item, ',
        selectorSearchPageAddToCart: '.catalogsearch-result-index .search.results .tocart, ',
        selectorPopupLink: '.search-autocomplete .amsearch-results .product-item-link, ',
        selectorPopupAddToCart: '.search-autocomplete .amsearch-results .tocart, ',
        selectorPopupCategories: '.search-autocomplete .amsearch-results .amsearch-item[data-search-block-type="category"], ',
        selectorPopupCMS: '.search-autocomplete .amsearch-results .amsearch-item[data-search-block-type="brand"], ',
        selectorPopupBrand: '.search-autocomplete .amsearch-results .amsearch-item[data-search-block-type="page"]',

        init: function (url) {
            this.url = url;
            var self = this,
                generalSelector = self.selectorSearchPageLink
                    + self.selectorSearchPageAddToCart
                    + self.selectorPopupLink
                    + self.selectorPopupAddToCart
                    + self.selectorPopupCategories
                    + self.selectorPopupCMS
                    + self.selectorPopupBrand;


            $(document).on("click", generalSelector, function () {
                self.callAjax();
            });
        },

        callAjax: function () {
            $.ajax({
                url: this.url,
                data: {'form_key': $.mage.cookies.get('form_key')}
            });
        },
    };

    return searchClick;
});
