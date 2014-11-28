document.addEventListener('DOMContentLoaded', function () {
    var childWindow = document.getElementById('theFrame').contentWindow;
    setTimeout(function () {
        childWindow.postMessage({
            message: 'start'
        }, '*');
    }, 500);


    var storage = new Storage();

    // on result from sandboxed frame:
    window.addEventListener('message', function (e) {
        message = e.data.message;

        switch (message) {
        case 'tasksInDate':
            var tasks = storage.tasksInDate(e.data.when);
            childWindow.postMessage({
                message: e.data.replyTo,
                tasks: tasks,
                when: e.data.when
            }, '*')
            break;
        case 'saveTask':
            storage.saveTask(JSON.parse(e.data.task));
            break;
        }
    });
});