    require([
    "jquery"
], function ($) {

    $('.page-title-wrapper').css('display','none');

    $('.add').click(function () {
        if ($(this).prev().val() < 10000) {
        $(this).prev().val(+$(this).prev().val() + 1);
        }
});
$('.sub').click(function () {
        if ($(this).next().val() > 1) {
        if ($(this).next().val() > 1) $(this).next().val(+$(this).next().val() - 1);
        }
});



    $('#grouped-prod').toggle(function () {
        $('.grouped, .box-tocart').css('display','block');
});

});