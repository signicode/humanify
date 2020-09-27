/* globals jQuery,location */
(function($) {

    /* globals io, Handlebars */
    let seq = 0;

    const cardTemplate = $("#card-template").html();
    const tpl = Handlebars.compile(cardTemplate);

    const liveQuestions = {};

    const base = location.pathname.replace(/\/(([^/]\.[^/]))?$/, "");
    console.log(`Connecting to ${base}`);
    const socket = io(base);

    $("#questions").on("click", ".question .btn", (btn) => {
        const but = $(btn.target);
        const queryId = but.parents(".question").data().queryid;
        const ret = but.data().index;

        socket.emit("answer", queryId, ret);
    });

    socket.on("connect", () => {
        console.info("Connected");
    });

    socket.on("inquiry", (data) => {
        liveQuestions[data.queryId] = data.cardId = "ref-" + seq++;
        const out = tpl(data);
        console.info("inquiry", data, out);
        $("#questions").append(out);
    });

    socket.on("outquiry", (id) => {
        console.info("outquiry", id);
        $("#" +liveQuestions[id]).remove();
    });

    socket.on("disconnect", () => {
        console.info("disconnect");
    });

})(jQuery);
