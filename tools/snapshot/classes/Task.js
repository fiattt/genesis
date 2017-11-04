// Tasks run in a waterfall, this abstracts that process and sets a convention for tasks.
// Mkes Snapshot config and state consistently accessible, and enables easier output accumulation
class Task  {
  constructor( config, completed ){
    this.config       = config
    this.on_complete  = completed
    this.state        = {}
    this.setup()
  }

  run( state ){
    this.state = state
    this.job()
  }

  finished(){
    this.on_complete(null, this.state)
  }

  //Override: Post-constructor
  setup(){}

  //Override: Primary task
  job(){
    this.on_complete(null, this.state)
  }
}
module.exports = Task
