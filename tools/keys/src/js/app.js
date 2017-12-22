const $     = require('jquery'),
      tabby = require('./tabby.js'),
      util = require('./utilities.js')

$(() => {
  bind.tabby()
  bind.reset()
})

const app     = {},
      helpers = {},
      gui     = {},
      bind    = {}

app.validator = (sel) => {
  $(sel).find('form').submit( function(e){
    e.preventDefault()
    const $pub    = $(this).find('input[name=public_key]'),
          $priv   = $(this).find('input[name=private_key]'),
          pub     = $pub.val(),
          priv    = $priv.val(),
          isValid = util.validateKeypair(pub, priv)

    $pub.removeClass('error') && $priv.removeClass('error')

    if(!isValid.publicKey && $pub.val().length)
      $pub.addClass('error')
    else
      $pub.addClass('valid')

    if(!isValid.privateKey && $priv.val().length)
      $priv.addClass('error')
    else
      $priv.addClass('valid')
  })
}

app.keygenSelect = (sel) => {
  const $el = $(sel)
  //quick
  $el.find('a.quick').on('click', () => {
    helpers.quickGen()
  })
  //Advanced Toggle
  $el.find('.advancedToggle').on('click', () => {
    const $container = $el.find('.advanced')
    if($container.hasClass('expanded')) {
      $container.removeClass('expanded')
      $(this).removeClass('expanded')
    } else {
      $container.addClass('expanded')
      $(this).addClass('expanded')
    }
  // //Generate Seed
  // $el.find('.generateSeed').on('click', () => app.generateSeed() )
  // //Input Your Own Seed
  // $el.find('.inputSeed').on('click', () => app.inputSeed() )
  })
}

app.generateSeed = (sel) => {
  const complete = seed => {
    tabby.toggleTab('#outputDisplay')
    gui.displayKey( util.genKeyPair(seed) )
  }

  const update = progress => {
    console.log(progress)
    $(sel).find('.progress').width(`${progress}%`)
  }

  util.generateSeed( update, complete )
}

app.inputSeed = (sel) => {
  $(sel).find('#inputSeed form').submit(function(e){
    e.preventDefault()
    gui.displayKey( util.genKeyPair( $(this).find('input:text').val() ) )
  })
}

app.outputDisplay = (sel) => {
  //bind copy func
}

app.outputSave = (sel) => {
  //ecrypt and save the file
  //provide link to file.
}


//Helpers
helpers.quickGen = () => {
  gui.displayKey( util.genKeyPair() )
}

//GUI
gui.displayKey = keypair => {
  tabby.toggleTab(sel)
  const $form = $('#outputDisplay form')
  $form.find('input[name=public_key]').attr('value', keypair.public)
  $form.find('input[name=private_key]').attr('value', keypair.private)
}

gui.reset = () => {
  tabby.toggleTab(sel)

  const $output = $('#outputDisplay form')
  $output.find('input[name=public_key]').attr('value', null)
  $output.find('input[name=private_key]').attr('value', null)

  const $validator = $('#validator form')
  $validator.find('input[name=public_key]').attr('value', null)
  $validator.find('input[name=private_key]').attr('value', null)
}

//Bindings
bind.reset = () => {
  $('a.reset').on('click', gui.reset)
}

bind.tabby = () => {
  tabby.init({
    callback: (tabs, toggle) => {
      const id = $(tabs).attr('id')
      if(typeof app[id] === 'function') app[id](`${id}`)
      return true
    }
  })
}
