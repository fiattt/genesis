module.exports = (state, complete) => {
  const det_ind = require('../../query').set_deterministic_indices

  det_ind()
    .then( result => {
      complete(null, state)
    })
    .catch( e => {throw new Error(e)} )

}
