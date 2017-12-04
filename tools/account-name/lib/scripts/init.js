$( function(){
  // $('input:text').on('keyup', function(){ lookup( $(this).val() ) })
  $('form').on('submit', function(e){
    e.preventDefault()
    lookup( $(this).find('input:text').val() )
  })
  $('a.reset').on('click', reset)
})

const lookup = function( value ){
    let found = -1

    if(startsWithETH(value)) {
      console.log('ETH');
      found = SNAPSHOT.findIndex( function(row){ return row.eth == value } )
    }
    else if(startsWithEOS(value)) {
      console.log('EOS');
      found = SNAPSHOT.findIndex( function(row){ return row.eos == value } )
    }
    else { display_invalid( value ) }


    if(found > 1) {
      display_account_name( found )
    } else {
      display_not_found( value )
    }

}

const display_account_name = function(row_num) {
  $('body').attr('id','result')
  $('.result').find('span').html( account_name( row_num ) )
}

const display_not_found = function( value ){
  $('body').attr('id','error-not-found')
  $('div.error-not-found span').html(value)
}

const display_invalid = function( value ){
  $('body').attr('id','error-invalid')
  $('span.error-invalid').find('span').text(value)
}

const account_name = function(row_num){
  return base32.encode( row_num.toString() ).replace(/=/g, "").toLowerCase()
}

const reset = function() {
  $('body').attr('id', 'ready')
}


const startsWithETH = (query) => {
  var searchPattern = new RegExp('0x', 'i');
  return searchPattern.test(query)
}

const startsWithEOS = (query) => {
  var searchPattern = new RegExp('EOS', 'i');
  // console.log(`${query} has eos`, searchPattern.test(query) )
  return searchPattern.test(query)
}
