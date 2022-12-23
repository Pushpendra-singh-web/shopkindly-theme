/**
 * @author    Amasty Team
 * @copyright Copyright (c) Amasty Ltd. ( http://www.amasty.com/ )
 * @package   Amasty_Shopby
 */
define([
    "jquery",
    "jquery/ui",
    "mage/tooltip",
    'mage/validation',
    'mage/translate',
    "Amasty_Shopby/js/jquery.ui.touch-punch.min",
    'Amasty_ShopbyBase/js/chosen/chosen.jquery',
    'amShopbyFiltersSync'
], function ($) {
    'use strict';

    $.widget('mage.amShopbyFilterAbstract', {
        filters: {},
        options: {
            isAjax: 0,
            collectFilters: 0
        },
        getFilter: function () {
            var filter = {
                'code': this.element.attr('amshopby-filter-code'),
                'value': this.element.attr('amshopby-filter-value')
            };
            return filter;
        },
        apply: function (link, clearFilter) {
            try {
                if ($.mage.amShopbyAjax) {
                    $.mage.amShopbyAjax.prototype.response = null;
                }

                this.options.isAjax = $.mage.amShopbyAjax != undefined;
                var linkParam = clearFilter ? link : null;
                if (!this.options.collectFilters && this.options.isAjax == true) {
                    this.prepareTriggerAjax(this.element, linkParam, clearFilter);
                } else {
                    if (this.options.collectFilters === 1) {
                        this.prepareTriggerAjax(this.element, linkParam);
                    } else {
                        window.location = link;
                    }
                }
            } catch (e) {
                window.location = link;
            }
        },

        prepareTriggerAjax: function (element, clearUrl, clearFilter, isSorting) {
            var forms = $('form[data-amshopby-filter]');
            if (typeof this.element !== 'undefined' && clearFilter) {
                var attributeName = this.element.closest(".filter-options-content").find('form').data('amshopby-filter');
                var excludedFormSelector = ((this.element.closest("div.sidebar").length === 0)
                    ? 'div.catalog-topnav' : 'div.sidebar') + ' form[data-amshopby-filter=' + attributeName +']';
                forms = forms.not(excludedFormSelector);
            }

            var existFields = [],
                savedFilters = [];
            forms.each(function (index, item) {
                var $item = $(item);
                var className = '';
                if ($item.closest('[class*="am-filter-items"]').length) {
                    className = $item.closest('[class*="am-filter-items"]')[0].className;
                } else if ($item.find('[class*="am-filter-items"]').length) {
                    className = $item.find('[class*="am-filter-items"]')[0].className;
                }
                var startPos = className.indexOf('am-filter-items'),
                    endPos = className.indexOf(' ', startPos + 1) == -1 ? 100 : className.indexOf(' ', startPos + 1),
                    filterClass = className.substring(startPos, endPos),
                    isPriceType = $($item.closest('.filter-options-item')).find('[data-am-js="fromto-widget"]').length;

                if (filterClass && existFields[filterClass] && !isPriceType) {
                    forms[index] = '';
                } else {
                    existFields[filterClass] = true;
                }

                if ($item.hasClass('am_saved_filter_values')) {
                    savedFilters.push(forms[index]);
                    forms[index] = '';
                }
            });

            var serializeForms = forms.serializeArray(),
                isPriceExist = false;
            _.each(serializeForms, function (index, item) {
                if (item['name'] == 'amshopby[price][]') {
                    isPriceExist = true;
                    return false;
                }
            });

            if (!isPriceExist && savedFilters) {
                savedFilters.forEach(function (element) {
                    serializeForms.push($(element).serializeArray()[0]);
                });
            }

            var data = this.normalizeData(serializeForms, isSorting, clearFilter);
            data.clearUrl = data.clearUrl ? data.clearUrl : clearUrl;
            element = element ? element : document;
            $(element).trigger('amshopby:submit_filters', {data: data, clearFilter: clearFilter, isSorting: isSorting});
            return data;
        },

        normalizeData: function (data, isSorting, clearFilter) {
            var normalizedData = [],
                ajaxOptions = $("body.page-with-filter, body.catalogsearch-result-index, body.cms-index-index").amShopbyAjax('option'),
                clearUrl;

            _.each(data, function (item) {
                if (item && item.value.trim() != '' && item.value != '-1') {
                    var isNormalizeItem = _.find(normalizedData, function (normalizeItem) {
                        return normalizeItem.name === item.name && normalizeItem.value === item.value
                            || item.name == 'amshopby[price][]' && normalizeItem.name === item.name;
                    });

                    if (!isNormalizeItem) {
                        if (item.name == 'amshopby[price][]') {
                            item.value = item.value.replace(/[ \r\n]/g, '');
                        }
                        normalizedData.push(item);

                        if (ajaxOptions.isCategorySingleSelect == '1'
                            && item.name === 'amshopby[cat][]'
                            && item.value != ajaxOptions.currentCategoryId
                            && !clearFilter
                            && !isSorting
                        ) {
                            clearUrl = $('*[data-amshopby-filter-request-var="cat"] *[value="' + item.value + '"]')
                                .parent().attr('href');
                        }
                    }
                }
            });

            normalizedData = this.groupDataByName(normalizedData);
            normalizedData.clearUrl = clearUrl;
            return normalizedData;
        },

        groupDataByName: function (formData, fn) {
            var hash = Object.create(null);
            return formData.reduce(function (result, currentValue) {
                if (!hash[currentValue['name']]) {
                    hash[currentValue['name']] = {};
                    hash[currentValue['name']]['name'] = currentValue['name'];
                    result.push(hash[currentValue['name']]);
                }

                if (hash[currentValue['name']].value) {
                    hash[currentValue['name']].value += ',' + currentValue.value;
                } else {
                    hash[currentValue['name']].value = currentValue.value;
                }

                return result;
            }, []);
        },

        getSignsCount: function (step, isPrice) {
            if (step < 1 && step > 0) {
                return step.toString().length - step.toString().indexOf(".") - 1;
            }

            return 0;
        },
        getFloatNumber: function (size) {
            if (!size) {
                size = 2;
            }

            return 1 / parseInt(this.buildNumber(size));
        },
        buildNumber: function (size) {
            var str = "1";
            for (var i = 1; i <= size; i++) {
                str += "0";
            }

            return str;
        },
        getFixed: function (value, isPrice) {
            var fixed = 2;
            if (value) {
                fixed = this.getSignsCount(this.options.step, isPrice);
            }

            return fixed;
        },
        isPrice: function () {
            return (typeof this.options.code != 'undefined' && this.options.code == 'price');
        },
        renderShowButton: function (event, element) {
            if ($.mage.amShopbyApplyFilters) {
                $.mage.amShopbyApplyFilters.prototype.renderShowButton(event, element);
            }
        }
    });

    $.widget('mage.amShopbyFilterItemDefault', $.mage.amShopbyFilterAbstract, {
        options: {},
        _create: function () {
            var self = this;
            $(function () {
                var link = self.element,
                    parent = link.parents('.item'),
                    checkbox = link.find('input[type=checkbox], input[type=radio]');

                if (link.find('[name="amshopby[cat][]"]').length && parent) {
                    parent = $(null);//get only current category item
                }

                var params = {
                    parent: parent,
                    checkbox: checkbox,
                    link: link
                };

                checkbox.bind('click', params, function (e) {
                    var checkbox = $(this),
                        link = e.data.link,
                        href = link.prop('href');

                    setTimeout(function () {
                        self.triggerSync(checkbox, !checkbox.prop('checked'));
                        if (self.isFinderAndCategory(checkbox[0])) {
                            location.href = href;
                            return;
                        }
                        $.mage.amShopbyFilterAbstract.prototype.renderShowButton(e, link);
                        self.apply(href);
                    }, 10);
                    e.stopPropagation();
                });

                link.bind('click', params, function (e) {
                    var element = e.data.checkbox,
                        href = e.data.link.prop('href');
                    element.prop('checked', !element.prop('checked'));
                    self.triggerSync(element, !element.prop('checked'));
                    if (self.isFinderAndCategory(element[0])) {
                        location.href = href;
                        return;
                    }
                    $.mage.amShopbyFilterAbstract.prototype.renderShowButton(e, element);
                    self.apply(href);

                    e.stopPropagation();
                    e.preventDefault();
                });

                parent.bind('click', params, function (e) {
                    var element = e.data.checkbox;
                    var link = e.data.link;
                    element.prop('checked', !element.prop('checked'));
                    self.triggerSync(element, !element.prop('checked'));
                    $.mage.amShopbyFilterAbstract.prototype.renderShowButton(e, element);
                    self.apply(link.prop('href'));

                    e.stopPropagation();
                    e.preventDefault();
                    return false;
                });

                checkbox.on('change', function (e) {
                    self.markAsSelected($(this));
                });

                checkbox.on('amshopby:sync_change', function (e) {
                    self.markAsSelected($(this));
                });

                self.markAsSelected(checkbox);
            })
        },
        triggerSync: function (element, clearFilter) {
            element.trigger('change');
            element.trigger('sync', [clearFilter]);
        },
        isFinderAndCategory: function (element) {
            return location.href.indexOf('find=') !== -1
                && element.type == 'radio'
                && element.name == 'amshopby[cat][]';
        },
        markAsSelected: function (checkbox) {
            checkbox.closest('form').find('a').each(function () {
                if (!$(this).find('input').prop("checked")) {
                    $(this).removeClass('am_shopby_link_selected');
                } else {
                    $(this).addClass('am_shopby_link_selected');
                }
            });
        }
    });

    $.widget('mage.amShopbyFilterCategoryLabelsFolding', $.mage.amShopbyFilterAbstract, {
        options: {},
        _create: function () {
            var self = this;
            $(function () {

                var link = self.element;
                var parent = $(link.parents('.item')[0]);
                var checkbox = link.find('input[type=checkbox], input[type=radio]');

                var params = {
                    parent: parent,
                    checkbox: checkbox,
                    link: link
                };

                checkbox.bind('click', params, function (e) {
                    var link = e.data.link,
                        href = link.prop('href');
                    if (this.type == 'radio' && location.href.indexOf('find=') !== -1) {
                        location.href = href;
                        return;
                    }
                    self.triggerSync(link, [!e.data.checkbox.prop('checked')]);
                    $.mage.amShopbyFilterAbstract.prototype.renderShowButton(e, $(e.target));
                    self.apply(href);
                    self.toggleCheckParentAndChildrenCheckboxes(e.data.parent, e.data.checkbox.prop('checked'));
                    e.stopPropagation();
                    e.preventDefault();
                });

                link.bind('click', params, function (e) {
                    var element = e.data.checkbox,
                        href = e.data.link.prop('href');
                    if ($(this).find('input[type=radio]')[0] && location.href.indexOf('find=') !== -1) {
                        location.href = href;
                        return;
                    }
                    element.prop('checked', !element.prop('checked'));
                    self.toggleCheckParentAndChildrenCheckboxes(e.data.parent, element.prop('checked'));
                    self.triggerSync(element, !element.prop('checked'));
                    $.mage.amShopbyFilterAbstract.prototype.renderShowButton(e, element);
                    self.apply(href);
                    e.stopPropagation();
                    e.preventDefault();
                });

                checkbox.on('change', function (e) {
                    self.markAsSelected($(this));
                });

                checkbox.on('amshopby:sync_change', function (e) {
                    self.markAsSelected($(this));
                });

                self.markAsSelected(checkbox);
            })
        },
        triggerSync: function (element, clearFilter) {
            element.trigger('change');
            element.trigger('sync', [clearFilter]);
        },
        markAsSelected: function (checkbox) {
            checkbox.closest('form').find('a').each(function () {
                if (!$(this).find('input').prop("checked")) {
                    $(this).removeClass('am_shopby_link_selected');
                } else {
                    $(this).addClass('am_shopby_link_selected');
                }
            });
        },
        toggleCheckParentAndChildrenCheckboxes: function (element, isChecked) {
            element.find('.items input[type="checkbox"]').prop('checked', false);
            element.parents('.item').find('>a input[type=checkbox]').prop('checked', false);
        }
    });

    $.widget('mage.amShopbyFilterCategoryFlyOut', $.mage.amShopbyFilterAbstract, {
        options: {},
        _create: function () {
            var self = this;
            $(function () {

                var link = self.element,
                    parent = $(link.parents('.item')[0]),
                    checkbox = link.find('input[type=checkbox], input[type=radio]'),
                    params = {parent: parent, checkbox: checkbox, link: link};

                link.bind('click', params, function (e) {
                    var element = e.data.checkbox,
                        href = e.data.link.prop('href');
                    if ($(this).find('input[type=radio]')[0] && location.href.indexOf('find=') !== -1) {
                        location.href = href;
                        return;
                    }
                    element.prop('checked', !element.prop('checked'));
                    self.triggerSync(element, !element.prop('checked'));
                    $.mage.amShopbyFilterAbstract.prototype.renderShowButton(e, element);
                    self.apply(href);
                    self.toggleCheckParentAndChildrenCheckboxes(e.data.parent, element.prop('checked'));

                    e.stopPropagation();
                    e.preventDefault();
                });

                checkbox.bind('click', params, function (e) {
                    var link = e.data.link,
                        href = link.prop('href');
                    if (this.type == 'radio' && location.href.indexOf('find=') !== -1) {
                        location.href = href;
                        return;
                    }
                    self.triggerSync(link, !link.find('input').prop('checked'));
                    $.mage.amShopbyFilterAbstract.prototype.renderShowButton(e, $(e.target));
                    self.apply(href);
                    e.data.parent.find('.items input[type="checkbox"]').prop('checked', false);
                    e.data.parent.parents('.item').find('>a input[type=checkbox]').prop('checked', false);
                    e.stopPropagation();
                });

                checkbox.on('change', function (e) {
                    self.markAsSelected($(this));
                });

                checkbox.on('amshopby:sync_change', function (e) {
                    self.markAsSelected($(this));
                });

                self.markAsSelected(checkbox);
            });
        },

        triggerSync: function (element, clearFilter) {
            element.trigger('change');
            element.trigger('sync', [clearFilter]);
        },

        markAsSelected: function (checkbox) {
            checkbox.closest('form').find('a').each(function () {
                if (!$(this).find('input').prop("checked")) {
                    $(this).removeClass('am_shopby_link_selected');
                } else {
                    $(this).addClass('am_shopby_link_selected');
                }
            });
        },

        toggleCheckParentAndChildrenCheckboxes: function (element, isChecked) {
            var parentElements = element.parents('.item').find('>a input[type=checkbox]');
            parentElements.prop('checked', isChecked);
        }
    });

    $.widget('mage.amShopbyFilterDropdown', $.mage.amShopbyFilterAbstract, {
        options: {
            isMultiselect: false,
            placeholderText: $.mage.__('Select Options'),
            selectedOptions: []
        },
        _create: function () {
            var self = this;
            self.options.selectedOptions[this.element[0].name] = [];
            if (self.element[0].selectedOptions && self.element[0].selectedOptions.length) {
                var selectedLength = self.element[0].selectedOptions.length;
                for (var i = 0; i < selectedLength; i++) {
                    self.options.selectedOptions[self.element[0].name].push(self.element[0].selectedOptions[i].value);
                }
            }

            $(function () {
                var $select = $(self.element[0]),
                    target,
                    value;

                if (self.options.isMultiselect) {
                    $select.chosen({
                        width: '100%',
                        placeholder_text: self.options.placeholderText
                    });
                } else {
                    $select.trigger('sync');
                }

                $select.change(function (e, elem) {
                    if (self.options.isMultiselect) {
                        elem = elem ? elem : $(ev.target);
                        value = elem.selected ? elem.selected : elem.deselected;
                        target = $(e.target).parent();
                    } else {
                        target = $select[0];
                        value = $select.val();
                    }

                    $select.trigger('sync', [!value]);

                    $.mage.amShopbyFilterAbstract.prototype.renderShowButton(e, target);
                    self.apply($select.find("option[value='" + value + "']").attr("href"));
                });
            })
        }
    });

    $.widget('mage.amShopbyFilterSwatch', $.mage.amShopbyFilterAbstract, {
        options: {},
        _create: function () {
            var self = this;
            $(function () {
                var inputSelector = '[name="amshopby[' + getAtrtibuteCode() + '][]"]';

                function getAtrtibuteCode() {
                    return $(self.element[0]).closest('form[data-amshopby-filter]').attr('data-amshopby-filter');
                }

                function checked($link) {
                    return $link.find(inputSelector).prop('checked') == 1
                }

                $(self.element[0]).find('a').on('click', function (e) {
                    var $link = $(this);
                    var $input = $link.find(inputSelector);
                    $input.prop('checked', checked($link) ? 0 : 1);
                    $input.trigger('change');
                    $input.trigger('sync', [!$input.prop('checked')]);
                    $.mage.amShopbyFilterAbstract.prototype.renderShowButton(e, this);
                    self.apply($link.attr('href'));
                    markSelected();
                    e.stopPropagation();
                    e.preventDefault();
                });

                $(self.element[0]).find(inputSelector).on('amshopby:sync_change', markSelected);

                function markSelected() {
                    $(self.element[0]).find('a').each(function () {
                        var $link = $(this);

                        if (checked($link)) {
                            $link.find('.swatch-option').addClass('selected');
                        } else {
                            $link.find('.swatch-option').removeClass('selected');
                        }
                    });
                }
            })
        }
    });

    $.widget('mage.amShopbyFilterSlider', $.mage.amShopbyFilterAbstract, {
        options: {},
        slider: null,
        value: null,
        display: null,
        _create: function () {
            $(function () {
                this.value = this.element.find('[amshopby-slider-id="value"]');
                this.slider = this.element.find('[amshopby-slider-id="slider"]');
                this.display = this.element.find('[amshopby-slider-id="display"]');
                var fromLabel = this.options.from && this.options.from >= this.options.min
                    ? this.options.from
                    : this.options.min;
                var toLabel = this.options.to && this.options.to <= this.options.max
                    ? this.options.to
                    : this.options.max;

                this.slider.slider({
                    step: this.options.step,
                    range: true,
                    min: this.options.min,
                    max: this.options.max,
                    values: [fromLabel, toLabel],
                    slide: this.onSlide.bind(this),
                    change: this.onChange.bind(this)
                });

                if (this.options.to) {
                    this.value.val(fromLabel + '-' + toLabel);
                } else {
                    this.value.trigger('change');
                    this.value.trigger('sync');
                }

                this.renderLabel(fromLabel, toLabel);

                this.value.on('amshopby:sync_change', this.onSyncChange.bind(this));

                if (this.options.hideDisplay) {
                    this.display.hide();
                }
            }.bind(this));
        },

        onChange: function (event, ui) {
            if (this.slider.skipOnChange !== true) {
                this.setValue(
                    ui.values[0],
                    ui.values[1],
                    true,
                    jQuery(ui.handle).closest('[data-am-js="slider-container"]').attr('rate')
                );
            }

            return true;
        },

        onSlide: function (event, ui) {
            var from = ui.values[0];
            var to = ui.values[1];

            this.setValue(from, to, false);
            this.renderLabel(from, to);
            return true;
        },

        onSyncChange: function (event, values) {
            var value = values[0].split('-');
            if (value.length === 2) {
                var fixed = 2,
                    from = (parseFloat(value[0])).toFixed(fixed),
                    to = parseFloat(value[1]).toFixed(fixed);

                this.slider.skipOnChange = true;

                this.slider.slider('values', [from, to]);
                this.setValueWtihoutChange(from, to);
                this.slider.skipOnChange = false;
            }
        },
        setValue: function (from, to, apply, rate) {
            var fixed = 2;
            from = (parseFloat(from)).toFixed(fixed);
            to = (parseFloat(to)).toFixed(fixed);

            var newVal = from + '-' + to,
                changed = this.value.val() != newVal;

            this.value.val(newVal);
            if (changed) {
                this.value.trigger('change');
                this.value.trigger('sync');
            }

            if (apply !== false) {
                newVal = from + '-' + to;
                this.value.val(newVal);
                var linkHref = this.options.url.replace('amshopby_slider_from', from).replace('amshopby_slider_to', to);
                $.mage.amShopbyFilterAbstract.prototype.renderShowButton(0, this.element[0]);
                this.apply(linkHref);
            }
        },
        setValueWtihoutChange: function (from, to) {
            var fixed = this.getSignsCount(this.options.step, 0);
            var newVal = parseFloat(from) + '-' + parseFloat(to);
            this.value.val(newVal);
        },
        getLabel: function (from, to) {
            return this.options.template.replace('{from}', from.toString()).replace('{to}', to.toString());
        },
        renderLabel: function (from, to) {
            var fixed = this.getSignsCount(this.options.step, 0);
            from = (parseFloat(from)).toFixed(fixed);
            to = (parseFloat(to)).toFixed(fixed);
            this.display.html(this.getLabel(from, to));
        }
    });

    $.widget('mage.amShopbyFilterFromTo', $.mage.amShopbyFilterAbstract, {
        from: null,
        to: null,
        value: null,
        timer: null,
        go: null,
        skip:false,
        _create: function () {
            $(function () {
                this.value = this.element.find('[amshopby-fromto-id="value"]');
                this.from = this.element.find('[amshopby-fromto-id="from"]');
                this.to = this.element.find('[amshopby-fromto-id="to"]');
                this.go = this.element.find('[amshopby-fromto-id="go"]');

                this.value.on('amshopby:sync_change', this.onSyncChange.bind(this));
                var priceSelector = '.am-filter-items-attr_price';

                if (this.value.val()
                    && !this.element.parent().find(priceSelector).length
                    && !this.element.closest(priceSelector).find('[data-am-js="slider-container"]').length
                    && !this.element.closest(priceSelector + '.am-dropdown').length
                ) {
                    var values = this.value.val().split('-'),
                        from = values[0],
                        to = values[1];
                    this.value.trigger('amshopby:sync_change', [[values ? from + '-' + to : '', true]]);
                } else {
                    var fromValue = this.options.from ? parseFloat(this.options.from).toFixed(2) : '',
                        toValue = this.options.to ? parseFloat(this.options.to).toFixed(2) : '',
                        newValue = fromValue + '-' + toValue;
                    this.value.trigger('amshopby:sync_change', [[this.value.val() ? this.value.val() : newValue, true]]);
                }

                if (this.go.length > 0) {
                    this.go.on('click', this.applyFilter.bind(this));
                }

                this.changeEvent(this.from, this.onChange.bind(this));
                this.changeEvent(this.to, this.onChange.bind(this));

                this.element.find('form').mage('validation', {
                    errorPlacement: function (error, element) {
                        var parent = element.parent();
                        if (parent.hasClass('range')) {
                            parent.find(this.errorElement + '.' + this.errorClass).remove().end().append(error);
                        } else {
                            error.insertAfter(element);
                        }
                    },
                    messages: {
                        'am_shopby_filter_widget_attr_price_from': {
                            'greater-than-equals-to': $.mage.__('Please enter a valid price range.'),
                            'validate-digits-range': $.mage.__('Please enter a valid price range.')
                        },
                        'am_shopby_filter_widget_attr_price_to': {
                            'greater-than-equals-to': $.mage.__('Please enter a valid price range.'),
                            'validate-digits-range': $.mage.__('Please enter a valid price range.')
                        }
                    }
                });

            }.bind(this));
        },
        onChange: function (event) {
            var to = this.to.val(),
                from = this.from.val(),
                fixed = this.getFixed(this.isSlider(), this.isPrice());

            if (!to) {
                to = this.options.max;
            }

            if (!from) {
                from = this.options.min;
            }

            var fromToInterval = this.checkFromTo(parseFloat(from), parseFloat(to)),
                oldVal = this.value.val(),
                oldValValues = oldVal.split('-'),
                newVal =  Number(fromToInterval.from).toFixed(fixed) + '-' +  Number(fromToInterval.to).toFixed(fixed),
                changed = !((fromToInterval.from == Number(oldValValues[0]))
                    && (fromToInterval.to == Number(oldValValues[1])));

            this.value.val(newVal);

            if (changed) {
                newVal = fromToInterval.from + '-' +  fromToInterval.to;
                this.value.val(newVal);
                this.value.trigger('change');
                this.value.trigger('sync');

                if (this.go.length === 0) {
                    $.mage.amShopbyFilterAbstract.prototype.renderShowButton(event, this.element[0]);
                    this.applyFilter();
                }
            }
        },
        applyFilter: function (e) {
            var to = this.to.val(),
                from = this.from.val(),
                isPrice = this.isPrice(),
                fromToInterval = this.checkFromTo(parseFloat(from), parseFloat(to)),
                linkHref = this.options.url
                    .replace('amshopby_slider_from', fromToInterval.from)
                    .replace('amshopby_slider_to', fromToInterval.to);
            this.apply(linkHref);

            if (e) {
                e.stopPropagation();
                e.preventDefault();
            }
        },

        onSyncChange: function (event, values) {
            var value = values[0].split('-'),
                fixed = this.getFixed(this.isSlider(), 0),
                max = Number(this.options.max).toFixed(fixed),
                min = Number(this.options.min).toFixed(fixed),
                to = max, from = min, rate = this.element.find('.range').attr('rate');

            if (value.length === 2 && (value[0] || value[1])) {
                from = value[0] == '' ? 0 : parseFloat(value[0]);
                to = (value[1] == 0 || value[1] == '') ? this.options.max : parseFloat(value[1]);

                if (this.isDropDown()) {
                    to = Math.ceil(to);
                }
            }

            this.element.find('[amshopby-fromto-id="from"]').val(from);
            this.element.find('[amshopby-fromto-id="to"]').val(to);
        },

        checkFromTo: function (from, to) {
            var interval = {};

            interval.from = from < this.options.min ? this.options.min : from;
            interval.from = interval.from > this.options.max ? this.options.min : interval.from;
            interval.to = to > this.options.max ? this.options.max : to;
            interval.to = interval.to < this.options.min ? this.options.max : interval.to;

            if (parseFloat(interval.from) > parseFloat(interval.to)) {
                var fromOld = interval.from;

                interval.from = interval.to;
                interval.to = fromOld;
            }

            return interval;
        },
        /**
         * trigger keyup on input with delay
         * @param input
         * @param callback
         */
        changeEvent: function (input, callback) {
            input.on('keyup', function (event) {
                if (this.timer != null) {
                    clearTimeout(this.timer);
                }
                if (this.go.length == 0) {
                    this.timer = setTimeout(callback(event), 1000);
                } else {
                    callback(event);
                }
            }.bind(this));
        },

        isSlider: function () {
            return (typeof this.options.isSlider != 'undefined' && this.options.isSlider);
        },

        isDropDown: function () {
            return (typeof this.options.isDropdown != 'undefined' && this.options.isDropdown);
        }
    });

    $.widget('mage.amShopbyFilterSearch', {
        options: {
            highlightTemplate: "",
            itemsSelector: ""
        },

        previousSearch: '',

        _create: function () {
            var self = this;
            var $items = $(this.options.itemsSelector + " .item");
            $(self.element).keyup(function () {
                self.search(this.value, $items);
            });
        },

        search: function (searchText, $items) {
            var self = this;

            searchText = searchText.toLowerCase();
            if (searchText == this.previousSearch) {
                return;
            }
            this.previousSearch = searchText;

            if (searchText != '') {
                $(this.element).trigger('search_active');
            }

            $items.each(function (key, li) {
                if (li.hasAttribute('data-label')) {
                    var val = li.getAttribute('data-label').toLowerCase();
                    if (!val || val.indexOf(searchText) > -1) {
                        if (searchText != '' && val.indexOf(searchText) > -1) {
                            self.hightlight(li, searchText);
                        } else {
                            self.unhightlight(li);
                        }
                        $(li).show();
                        var parentSelector = !self.options.isState ? '.filter-options-content' : '[data-am-js="shopby-container"]';
                        $(li).parentsUntil(parentSelector).show();
                    } else {
                        self.unhightlight(li);
                        $(li).hide();
                    }
                }
            });

            if (searchText == '') {
                $(this.element).trigger('search_inactive');
            }
        },
        hightlight: function (element, searchText) {
            this.unhightlight(element);
            var $a = $(element).find('a').length !== 0 ? $(element).find('a') : $(element);
            var label = $(element).attr('data-label');
            var newLabel = label.replace(new RegExp(searchText, 'gi'), this.options.highlightTemplate);
            $a.find('.label').html(newLabel);
        },
        unhightlight: function (element) {
            var $a = $(element).find('a').length !== 0 ? $(element).find('a') : $(element);
            var label = $(element).attr('data-label');
            $a.find('.label').html(label);
        }
    });

    $.widget('mage.amShopbyFilterHideMoreOptions', {
        options: {
            numberUnfoldedOptions: 0,
            _hideCurrent: false,
            buttonSelector: ""
        },

        _create: function () {
            var self = this,
                parentSelector = !self.options.isState ? '.filter-options-content' : '[data-am-js="shopby-container"]',
                button = $(self.options.buttonSelector);

            if (button.first().parents(parentSelector).find(".item").length > this.options.numberUnfoldedOptions) {
                button.show();
            } else {
                return;
            }

            $(this.element).parents('.filter-options-content').on('search_active', function () {
                if (self.options._hideCurrent) {
                    self.toggle(self.options.buttonSelector);
                }
                button.hide();
            });

            $(this.element).parents('.filter-options-content').on('search_inactive', function () {
                if (!self.options._hideCurrent) {
                    self.toggle(self.options.buttonSelector);
                }
                button.show();
            });

            button.unbind('click').click(function () {
                self.toggle(this);
            });

            // for hide in first load
            button.each(function (index, element) {
                if (!$(element).attr('first_load')) {
                    $(element).attr('first_load', true);
                    $(element).click();
                }
            });
        },

        toggle: function (button) {
            var $button = $(button);
            if ($(button)[0]._hideCurrent) {
                this.showAll($button);
                $button.html($button.attr('data-text-less'));
                $button.attr('data-is-hide', 'false');
                $(button)[0]._hideCurrent = false;
            } else {
                var count = this.hideAll($button);
                $button.html($button.attr('data-text-more'));
                $button.attr('data-is-hide', 'true');
                $(button)[0]._hideCurrent = true;
                $($button).find('.hide_count').html(count);
            }
        },

        hideAll: function ($button) {
            var self = this,
                count = 0,
                hideCount = 0;
            $($button).parent().find(".item").each(function () {
                count++;
                if (count > self.options.numberUnfoldedOptions) {
                    hideCount++;
                    $(this).hide();
                }
            });

            return hideCount;
        },
        showAll: function ($button) {
            $($button).parent().find(".item").show();
        }
    });

    $.widget('mage.amShopbyFilterAddTooltip', {
        options: {
            content: "",
            tooltipTemplate: ""
        },
        _create: function () {
            var template = this.options.tooltipTemplate.replace('{content}', this.options.content);
            var $template = $(template);

            var $place = $(this.element).parents('.filter-options-item').find('.filter-options-title');
            if ($place.length == 0) {
                $place = $(this.element).parents('dd').prev('dt');
            }

            if ($place.length > 0 && !$place.find('.tooltip').length) {
                $place.append($template);

                $template.tooltip({
                    position: {
                        my: "left bottom-10",
                        at: "left top",
                        collision: "flipfit flip",
                        using: function (position, feedback) {
                            $(this).css(position);
                            $("<div>")
                                .addClass("arrow")
                                .addClass(feedback.vertical)
                                .addClass(feedback.horizontal)
                                .appendTo(this);
                        }
                    },
                    content: function () {
                        return $(this).prop('title');
                    }
                });
            }
        }
    });

    $.widget('mage.amShopbyFilterCategoryDropdown', $.mage.amShopbyFilterAbstract, {
        options: {},
        _create: function () {
            var self = this;
            $(function () {
                var $element = $(self.element[0]);
                $element.click(function (e) {
                    $element.parent().addClass('am-item-removed');
                    $element.trigger('sync');
                    $.mage.amShopbyFilterAbstract.prototype.renderShowButton(e, $element);
                    self.apply($element.data('remove-url'), true);
                    e.preventDefault();
                    e.stopPropagation();
                });
            })
        }
    });

    $.widget('mage.amShopbyFilterContainer', {
        options: {
            collectFilters: 0
        },

        _create: function () {
            var self = this;
            $(function () {
                var $element = $(self.element[0]);
                var links = $element.find('[data-am-js="shopby-item"]');
                var allClear = $element.siblings('.filter-actions');
                var filters = [];
                if (links.length) {
                    $(links).each(function (index, value) {
                        var filter = {
                            attribute: $(value).attr("data-container"),
                            value: self.escapeHtml($(value).attr("data-value"))
                        };
                        filters.push(filter);

                        $(value).find('a').on("click", function (e) {
                            $(this).parent().addClass('am-item-removed');
                            $.mage.amShopbyFilterAbstract.prototype.renderShowButton(e, this);
                            self.apply(filter);
                            if (e) {
                                e.stopPropagation();
                                e.preventDefault();
                            }
                        });
                        if (filters.length) {
                            $.each(filters, function (index, filter) {
                                self.checkInForm(filter);
                            });
                        }
                    });
                }
            })
        },

        escapeHtml: function (text) {
            var map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };

            return text.replace(/[&<>"']/g, function (m) { return map[m]; });
        },

        apply: function (filter) {
            var link = $('li[data-container="' + filter.attribute + '"][data-value="' + filter.value + '"] a.remove').attr('href');

            try {
                var self = this;

                var value = filter.value;
                if (filter.attribute == 'price') {
                    var attrSelector = '[data-amshopby-filter="attr_' + filter.attribute + '"]';
                    //TODO For not price filters - there are no selectors -> no sync
                }

                self.setDefault(filter.attribute, value);

                $(attrSelector).trigger('change');
                $(attrSelector).trigger('sync', [true]);

                if ($.mage.amShopbyAjax != undefined) {
                    $.mage.amShopbyFilterAbstract.prototype.prepareTriggerAjax(null, null, true);
                } else if (this.options.collectFilters !== 1) {
                    window.location = link;
                }
            } catch (e) {
                window.location = link;
            }
        },

        clearBlock: function () {
            if (!$('[data-am-js="shopby-container"]').find("li").length) {
                $('[data-am-js="shopby-container"]').remove();
                $(".filter-actions").remove();
            }
        },

        setDefault: function (name, value) {
            var valueSelector = '[name="amshopby[' + name + '][]"]',
                filters = $(valueSelector),
                self = this;

            filters.each(function (index, filter) {
                var type = $(filter).prop("tagName");

                switch (type) {
                    case 'SELECT' :
                        if (name == 'price') {
                            $(filter).find('option').each(function (index, element) {
                                if (self.toValidView(element.value.split('-')) == this) {
                                    element.selected = false;
                                }
                            }.bind(value));
                        }

                        $(filter).find('[value="' + value + '"]').removeAttr('selected', 'selected');
                        break;
                    case 'INPUT' :
                        var selected = '';
                        if ($(filter).attr("type") != 'text' && $(filter).attr("type") != 'hidden') {
                            selected = $(valueSelector + '[value="' + value + '"]');
                            selected.removeAttr("checked");
                            selected.siblings('.swatch-option.selected').removeClass('selected');
                        } else if (($(filter).attr("type") == 'hidden' && self.isEquals(name, filter.value, value))
                            || name =='price'
                        ) {
                            filter.value = "";
                        }
                        break;
                }
            });
        },

        isEquals: function (name, filterValue, value) {
            var values = value.split('-'),
                filterValues = filterValue.split('-');
            if (values.length > 1) {
                filterValue = this.toValidView(filterValues);
                value = this.toValidView(values);
            }

            return filterValue == value;
        },

        toValidView: function (values) {
            values[0] = values[0] ? parseFloat(values[0]).toFixed() : values[0];
            values[1] = values[1] ? parseFloat(values[1]).toFixed() : values[1];

            return values[0] + '-' + values[1];
        },

        sliderDefault: function (name) {
            var valueSelector = '[name="amshopby[' + name + '][]"]',
                slider = $(valueSelector).siblings('[amshopby-slider-id="slider"]');
            if (slider.length) {
                var $parent = $(valueSelector).parent();
                $(slider[0]).slider("values", [$parent.attr('data-min'), $parent.attr('data-max')]);
                $(slider).siblings('[data-am-js="slider-display"]').text($parent.attr('data-min') + ' - ' + $parent.attr('data-max'));
            }
        },

        fromToDefault: function (name) {
            var range = $('[name="amshopby[' + name + '][]"]').siblings('.range');
            if (range.length) {
                var from = range.find('[amshopby-fromto-id="from"]'),
                    to = range.find('[amshopby-fromto-id="to"]'),
                    digits = $(from).attr('validate-digits-range'),
                    regexp = /\[([\d\.]+)-([\d\.]+)\]/g,
                    ranges = regexp.exec(digits);

                $(from).val(ranges[1]);
                $(to).val(ranges[2]);
            }
        },

        checkInForm: function (filter) {
            var name = filter.attribute,
                value = filter.value;

            if (this.checkIfValueNotExist(name, value)) {
                var block = $('#layered-filter-block');
                if (!block.length) {
                    block = $('.block.filter');
                }

                block.append('<form class="am_saved_filter_values" data-amshopby-filter="attr_'
                    + name + '"><input value="' + value + '" type="hidden" name="amshopby[' + name + '][]"></form>')
            }
        },

        checkIfValueNotExist: function (name, value) {
            var notExistValue = true;
            $('[name="amshopby[' + name + '][]"]').each(function (index, item) {
                if (item.multiple && $(item).hasClass('am-select')) {
                    var multiSelectOptions = [];
                    $(item.selectedOptions).each(function (index, option) {
                        multiSelectOptions.push(option.value);
                    });

                    if (multiSelectOptions.length && multiSelectOptions.includes(value)) {
                        notExistValue = false;
                    }
                } else if (!item.value) {
                    notExistValue = false;
                }  else if ($(item).is('[amshopby-fromto-id="value"]')) {
                    var splitedValue = value.split('-'),
                        splitedCurrentValue = item.value.split('-');

                    if (splitedValue[0] && splitedValue[1] && splitedCurrentValue[0] && splitedCurrentValue[1]
                        && Number(splitedValue[0]) == Number(splitedCurrentValue[0])
                        && Number(splitedValue[1]) == Number(splitedCurrentValue[1])
                    ) {
                        notExistValue = false;
                    }
                } else if (item.value == value) {
                    notExistValue = false;
                }
            });

            return notExistValue;
        }
    });
});
