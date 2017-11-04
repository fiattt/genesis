const async           = require('async')
const db              = require('../../models')
const Task            = require('../../classes/Task')

const get_period_map = (callback = () => {}) => {
  db.State
    .findAll({
      where: {
        meta_key: 'period_block_map'
      },
      attributes: ['meta_value']
    })
    .then( result => {
      let map
      if(result.length)
        map = JSON.parse( result[0].dataValues.meta_value )
      else {
        map = []
      }
      callback(map)
    })
}

class TaskPeriods extends Task {
  job(){
    get_period_map( map => {
      const PeriodMap = require('../../classes/PeriodMap')
      let periods = new PeriodMap(map)
      if(periods.syncedToPeriod() < this.config.period ) {
        periods.periodMax = this.config.period
        periods.generate( result => {
          db.State
            .upsert({meta_key: 'period_block_map', meta_value: JSON.stringify(periods.map)})
            .then( () => {
              this.state.period_map          = periods.map
              this.state.block_begin         = periods.map[0].begin
              this.state.block_end           = periods.map[this.config.period].end
              this.finished()
            })
        })
      }
      else {
        this.state.period_map          = periods.map
        this.state.block_begin         = periods.map[0].begin
        this.state.block_end           = periods.map[this.config.period].end
        this.finished()
      }
    })
  }

}

module.exports = TaskPeriods
