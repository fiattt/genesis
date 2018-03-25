module.exports = ( state, complete )  => {
  if(state.frozen > 0 && config.mode == 'mainnet') {
    state.block_begin = CS_BLOCK_FIRST
    state.block_end = state.frozen
  } else {
    state.block_begin         = state.period_map[0].begin
    state.block_end           = state.period_map[config.period].end
  }
  complete(null, state)
}
