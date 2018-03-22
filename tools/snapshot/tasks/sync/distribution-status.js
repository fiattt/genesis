module.exports = ( state, complete ) => {
  const colors = require("colors/safe"),
        series    = require('async').series,
        contract = require('../../helpers/web3-contract.js')

  const is_distribution_over = next => {
    state.crowdsale_over = ((new Date() / 1000 | 0) > CS_END_TIME)
    if(state.crowdsale_over)
      console.log(colors.yellow(`Distribution has ended`))
    else
      console.log(colors.green(`Distribution is active`))
    next()
  }

  const is_token_frozen = next => {
    contract.$token.methods.stopped().call()
      .then( stopped => {
        state.frozen = stopped ? 1 : 0
        next()
      })
  }

  const when_tokens_froze = next => {
    if(!state.frozen) {

      next()
      return
    }

    const settings = {}
    const blocks_per_iteration = 100
    const block_iterations = Math.ceil((state.frozen - state.period_map[CS_NUMBER_OF_PERIODS-1].end)/per_iteration)
    const block_offset = state.period_map[CS_NUMBER_OF_PERIODS-1].end
    //To prevent possible memory heap issues, we'll iterate through 100 blocks at a time
    //Requires a little trickery (web3js does not provide a method for this)
    let loop = _for(0, function (i) { return i <= block_iterations }, function (i) { return i + 1; },
      function loopBody(i, _break, _continue) {

        //Calculate block ranges to run for each pass
        settings.begin = (i*blocks_per_iteration)+block_offset
        settings.end = settings.begin+blocks_per_iteration-1
        settings.index = i
        settings.total = block_iterations

        contract.$token
          .getPastEvents('LogFreeze', { fromBlock : settings.begin, toBlock: settings.end })
          .then( logs => {
            if(logs.length && state.frozen == 0)
              state.frozen = logs[0].blockNumber,
              _break()
            else
              _continue()
          })
      });

    loop(() => {
      clearInterval(log_intval)
      log('green', true)
      // console.log(color.green(``))
      if(tokens.frozen > 0)
        console.log(colors.yellow(`Tokens were frozen at block ${state.frozen}`))
      else
        console.log(colors.green("Tokens are liquid"))
      setTimeout(() => next, 5000)
    })

  }

  const check = recheck => {
    series([
      is_distribution_over,
      is_token_frozen,
      when_tokens_froze,
    ], () => {
      //The crowdsale is over, and tokens are frozen.
      if(state.frozen > 0 && state.crowdsale_over) {
        // if(config.mode != "mainnet") {
          //prompt "Would you like to generate a mainnet snapshot"
          complete(null, state)
        // }
        
      }
      //Tokens aren't frozen, but the mode is set for mainnet. Keep checking until tokens are frozen.
      else if(state.frozen == 0 && state.crowdsale_over && config.mode == "mainnet") {
        setTimeout(() => {
          if(!recheck) console.log(colors.green("The crowdsale is over and your config indicats you would like to generate a mainnet snapshot, however, the tokens are not yet frozen. Will check once a second, until the tokens are frozen."))
          check(true)
        }, 1000)
      }
      //Tokens aren't frozen and the crowdsale isn't even over.
      else {
        complete(null, state)
      }
    })
  }

  check()

}
