/* globals jQuery */
(function($) {
    $("body").on("mousewheel", function(event, delta) {
        this.scrollLeft -= (delta * 30);
        event.preventDefault();
    });
})(jQuery);
