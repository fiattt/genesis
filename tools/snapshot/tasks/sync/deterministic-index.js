module.exports = (state, complete) => {
  const det_ind = require('../../queries').set_deterministic_indices

  det_ind()
    .then( result => {
      console.log(`Deterministic Indices Set.`)
      complete(null, state)
    })
    .catch( e => {throw new Error(e)} )

}
