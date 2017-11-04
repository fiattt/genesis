let Table          = require('ascii-table')

const log_table_reset = () => {
  table = new Table(`${Math.round(index*50/uniques.size*100)}% [${index*50}/${uniques.size}] `)
  table.setHeading('A', 'V', 'F', 'ETH', 'EOS', 'In Wallet', 'Unclaimed', 'Reclaimed', 'Total', 'Error(s)')
}

const log_table_render_and_reset = () => {
  index++
  console.log(table.render())
  log_table_reset()
}

const log_table_row = wallet => {
  table.addRow(
    (!wallet.accepted ? ` ` : `✓`),
    (wallet.register_error ? ` ` : `✓`),
    (!wallet.fallback ? ` ` : `✓`),
    wallet.address,
    wallet.eos_key,
    `${wallet.balance.wallet} EOS`,
    `${wallet.balance.unclaimed} EOS`,
    `${wallet.balance.reclaimed} EOS`,
    `${wallet.balance.total} EOS`,
    `${wallet.register_error ? wallet.register_error : ""} ${wallet.fallback_error ? wallet.fallback_error : ""}`
  )
}
