const Task = require('./task')

class Queue {

  constructor( config, callback ){
    this.config = config
    this.state = {}
    this.tasks = []
    this.callback = callback

    this.first_task()
    this.setup()
  }

  setup(){}

  first_task(){
    this.tasks.push( next_task => {
      console.log('Begin: Snapshot')
      this.state.started = (Date.now() / 1000 | 0)
      next_task( null, this.state )
    })
  }

  //It's a Task class
  task( task ){
    console.log( task )
    this.tasks.push( (state, next_task) => new task( this.config, next_task ).run(state) )
    return this
  }

  //It's a function
  fn( fn ){
    console.log( fn )
    this.tasks.push( (state, next_task) => fn( this.config, state, next_task ) )
    return this
  }

  begin(){
    const waterfall = require('async').waterfall
    waterfall(this.tasks, (error,result) => this.callback(error, result) )
    return this
  }

}

module.exports = Queue
