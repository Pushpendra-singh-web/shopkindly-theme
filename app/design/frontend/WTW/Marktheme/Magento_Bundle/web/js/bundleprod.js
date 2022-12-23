require([
"jquery"
], function($){
	jQuery(document).ready(function() {

  /*$('.fieldset-bundle-options .option.grid-item > .label').click( function(){
    if ( $(this).next().hasClass('current') ) {
        $(this).next().removeClass('current');
    } else {
        $('.fieldset-bundle-options .option.grid-item > div.control').removeClass('current');
        $(this).next().addClass('current');
    }
}); */


      $("#bundle-slide").click(function(){
      //	alert('#bundle-slide');
      if($(".product-row-division").is(':visible')){
        $(".product-row-division").hide();
        $('.fieldset-bundle-options .option.grid-item > div.control:first-child').addClass('current');
      }
});

$("#backbutton").click(function(){
	//alert('.customization');
  $(".product-row-division").show();
});


var selecteditemscount = $('.change-container-classname:checked').length;
console.log(selecteditemscount);
$("#selected-items-count").text(selecteditemscount + ' items');

 $(".change-container-classname").click(function(){
   var selecteditemscount = $('.change-container-classname:checked').length;
console.log(selecteditemscount);
$("#selected-items-count").text(selecteditemscount + ' items');

});



	});
});
