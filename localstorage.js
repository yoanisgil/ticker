var  Storage = function(){};

Storage.prototype.getTasks = function(){
    var tasks = localStorage.getItem('tasks');
    
    if (null == tasks){
        tasks = {}
        localStorage.setItem('tasks', '{}');
    } else {
        tasks = JSON.parse(tasks);
    }
    
    return tasks;
}

Storage.prototype.saveTask = function(task){
    var tasks = this.getTasks();
    
    var dateTasks = tasks[task.date];
    
    if (null == dateTasks){
        dateTasks = {};
    }
    
    dateTasks[task.id] = task;
    tasks[task.date] = dateTasks;
    
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

Storage.prototype.tasksInDate = function(when){
    tasks = this.getTasks();
    
    tasksInDate = tasks[when];
    
    return (tasksInDate == null) ? [] : tasksInDate;
}