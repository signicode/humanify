/* globals jQuery */
(function($) {

    /* globals io, Handlebars */
    let seq = 0;

    const tpl = Handlebars.compile($("#card-template").html());
    const liveQuestions = {};

    const socket = io(location.pathname);
    $("#questions").on("click", ".question .btn", (btn) => {
        const but = $(btn.target);
        const queryId = but.parents(".question").data().queryid;
        const ret = but.data().index;

        socket.emit("answer", queryId, ret);
    });

    socket.on("connect", () => {

    });
    socket.on("inquiry", (data) => {
        liveQuestions[data.queryId] = data.cardId = "ref-" + seq++;
        $("#questions").append(tpl(data));
    });
    socket.on("outquiry", (id) => {
        $("#" +liveQuestions[id]).remove();
    });
    socket.on("disconnect", () => {

    });

})(jQuery);
