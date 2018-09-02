var token

const https = require('https')

const errfunc = (err) => {console.error(null, err.message);}

const createHandler = (thingToDo) => {
	return (resp) => {var data = ''; resp.on('data', (chunk) => {data+=chunk}); resp.on('end', () => {thingToDo(JSON.parse(data).data)});}
}

const createListHandler = (thingToDo) => {
	return (resp) => {var data = ''; resp.on('data', (chunk) => {data+=chunk}); resp.on('end', () => {const list = JSON.parse(data).data; for (var item = 0; item < list.length; item++) {thingToDo(list[item])}});}
}

const asanaOptions = (path) => {
	return { host: 'app.asana.com', path: '/api/1.0'+path, headers: { Authorization: 'Bearer ' + token } }
}

const save = (task) => {
	var options = asanaOptions('/tasks/'+task.id+'?completed=false&due_on='+task.due_on)
	options.method = 'PUT'
	console.log(options)
	https.request(options, createHandler(()=>{})).on('error', errfunc).end();
}

const resetToDateIfCompleted = (date) => {
	return (task) => {
		if (task.completed) {
			task.due_on = date
			task.completed = false;
			save(task);
		}
	}
}

const doToTasks = (section, thingToDo) => {
	https.get(asanaOptions('/sections/'+section+'/tasks'), createListHandler(thingToDo)).on('error', errfunc);
}

const doToTask = (thingToDo) => {
	return (task) => { https.get(asanaOptions('/tasks/'+task.id), createHandler(thingToDo)).on('error', errfunc) };
}

const tomorrow = () => {
	var date = new Date();
	date.setDate(date.getDate() + 1);
	return date.toISOString().substring(0, 10);
}

exports.handler = (event, context, callback) => {
	token = event.token
	const printJson = (tasks) => {callback(null, tasks);}
	doToTasks(event.dailySectionId, doToTask(resetToDateIfCompleted(tomorrow())))
	//doToTasks(event.dailySectionId, printJson)
};