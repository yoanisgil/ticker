var router = new kendo.Router();
var calendarView;
var layout;
var dataSource;
var listView;
var timer;
var runningTask;
var parentWindow;

var Task = kendo.data.Model.define({
    id: "id",
    fields: {
        description: "description",
        status: "status",
        times: "times",
        date: "date"
    },
    formatDisplayTime: function () {
        var totalTime = 0;
        var times = this.get('times');

        for (var i = 0; i < times.length; i++) {
            totalTime += times[i].end - times[i].start;
        }

        totalTime = totalTime / 1000;

        var hours = parseInt(totalTime / 3600);
        var minutes = parseInt((totalTime % 3600) / 60);

        var displayTime = '';

        if (hours > 0) {
            displayTime = hours + 'h';
        }

        displayTime += (minutes > 0) ? ' ' + minutes + 'm' : ' 1m';

        return displayTime;
    },
    start: function () {
        var date = new Date();
        var times = this.get('times');

        times.push({
            start: date.getTime(),
            end: date.getTime()
        });

        var task = this;

        timer = setInterval(function () {
            var date = new Date();

            var last = times[times.length - 1];
            last.end = date.getTime();

            task.set('time', task.formatDisplayTime());

            task.save();
        }, 10 * 1000);

        this.set('status', 'start');

        this.save();
    },
    stop: function () {
        var date = new Date();
        var times = this.get('times');

        var last = times[times.length - 1];
        last.end = date.getTime();

        if (timer != null) {
            clearInterval(timer);
            timer = null;
        }

        this.set('status', 'stop');

        this.save();
    },
    toggleState: function () {
        var task = this;

        var newStatus = (task.get('status') == 'start') ? 'stop' : 'start';

        switch (newStatus) {
        case 'start':
            this.start();
            break;
        case 'stop':
            this.stop();
            break;
        }
    },
    save: function(){
        parentWindow.postMessage({
            message: 'saveTask',
            task: JSON.stringify(this)
        }, '*');
    }
});

function onLoadTasksInDate(when, data) {
    var model = kendo.observable({
        when: when
    });
    var index = new kendo.View('tasks', {
        model: model
    });

    layout.showIn("#content", index);

    $("#back").kendoButton({
        click: function (e) {
            router.navigate('/');
        }
    });

    dataSource = new kendo.data.DataSource({
        data: [],
        schema: {
            model: Task
        }
    });

    $.each(data, function (index, o) {
        dataSource.add(o);
    });

    listView = $("#tasks_list").kendoListView({
        dataSource: dataSource,
        template: kendo.template($("#task_template").html()),
    }).delegate(".k-button", "mousedown", function (e) {
        e.stopPropagation();

        var id = $(e.target).data('id');
        var task = dataSource.getByUid(id);

        if (runningTask != null && runningTask != task) {
            runningTask.stop();
        }

        task.toggleState();

        runningTask = task;

        return false;
    }).delegate('.task-description', 'change', function (e) {
        var id = $(e.target).data('id');
        var task = dataSource.getByUid(id);

        task.set('description', $(e.target).val());

        task.save();

        e.stopPropagation();
    });

    listView = $("#tasks_list").data("kendoListView");

    $("#add_task").kendoButton({
        click: function (e) {
            dataSource.add({
                id: '_' + Math.random().toString(36).substr(2, 9),
                description: 'task',
                status: 'stop',
                time: 0,
                times: [],
                date: when
            })
            e.preventDefault();
        }
    });
}

router.route('/tasks/:when', function (when) {
    parentWindow.postMessage({
        message: 'tasksInDate',
        when: when,
        replyTo: 'onLoadTasksInDate'
    }, '*');


});

router.route('/', function () {
    if (calendarView == null) {
        calendarView = new kendo.View('calendar_view');
        $("#calendar").kendoCalendar({
            change: function () {
                var year = new String(this.value().getFullYear());
                var month = new String(this.value().getMonth() + 1);
                var day = new String(this.value().getDate());

                router.navigate('/tasks/' + year + '-' + month + '-' + day);
            }
        });
    }

    layout.showIn("#content", calendarView);
});

window.addEventListener('message', function (e) {
    if (parentWindow == null) {
        parentWindow = e.source;
    }

    message = e.data.message;

    switch (message) {
    case 'start':
        layout = new kendo.Layout("<header>Header</header><section id='content'></section><footer></footer>");
        layout.render($("#app"));

        router.start();
        break;
    case 'onLoadTasksInDate':
        onLoadTasksInDate(e.data.when, e.data.tasks);
        break;
    }
    //    e.source.postMessage({}, '*');
});