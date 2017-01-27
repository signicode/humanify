$(function() {

    /* globals io, Handlebars */

    const tpl = Handlebars.compile($("#card-template").html());

    $("body").on("mousewheel", function(event, delta) {
        this.scrollLeft -= (delta * 30);
        event.preventDefault();
    });



    const socket = io('/');
    socket.on('connect', () => {});
    socket.on('inquiry', (data) => {
        console.log("data", data);
        $("questions").append(
            tpl(data)
        );
    });
    socket.on('outquiry', (id) => {
        $('#inq-'+id).remove();
    });
    socket.on('disconnect', () => {});

});
