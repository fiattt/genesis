module.exports = ( state, complete ) => {
  const colors = require("colors/safe"),
        series    = require('async').series,
        contract = require('../../helpers/web3-contract.js')


  const is_distribution_over = next => {
    state.crowdsale_over = typeof state.period_map[350] != 'undefined' && typeof state.period_map[350].end != 'undefined'
    if(state.crowdsale_over)
      console.log(colors.red(`Distribution has ended`))
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
      console.log(colors.green("Tokens are liquid"))
      next()
      return
    }
    contract.$token
      .getPastEvents('LogFreeze', { fromBlock : state.period_map[CS_NUMBER_OF_PERIODS-1].end, toBlock : "current" })
      .then( logs => {
        if(logs.length)
          state.frozen = logs[0].blockNumber,
          console.log(colors.red(`Tokens were frozen at block ${state.frozen}`))
        next()
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
