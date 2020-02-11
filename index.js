const { PersonalCapital } = require('personalcapital-js-telegram')
const { filter, asyncForEach, timeout, formatTicker } = require('./utils')
const CryptoBalances = require('crypto-and-token-balances')
const tcfs = require('tough-cookie-file-store')
const request = require('request-promise-native')
const userWallets = require('./wallets.json')
const {
  ETHPLORER_API_KEY,
  COINMARKETCAP_API_KEY,
  BLOCKONOMICS_API_KEY,
  TELEGRAM_TOKEN,
  TELEGRAM_CHAT_ID,
  PERSONAL_CAPITAL_USERNAME,
  PERSONAL_CAPITAL_PASSWORD
} = require('./credentials.json')

const PC_HOLDING_ACCOUNT_NAME = 'Cryptocurrencies'

const cryptoBalances = new CryptoBalances(
  COINMARKETCAP_API_KEY,
  ETHPLORER_API_KEY,
  BLOCKONOMICS_API_KEY
)

const pc = new PersonalCapital(
  (name = 'pcjs'),
  (cookiejar = request.jar(new tcfs('./pc-cookie.json'))),
  TELEGRAM_TOKEN,
  TELEGRAM_CHAT_ID
)

async function authWithPersonalCapital() {
  console.log('starting')
  await pc.auth(PERSONAL_CAPITAL_USERNAME, PERSONAL_CAPITAL_PASSWORD)
  console.log('auth complete')
}

async function createAssetsThatDoNotExist(cryptoAccount, walletData) {
  const existingAssets = await filter(walletData, async asset => {
    const ticker = formatTicker(asset.ticker)
    if (asset.usdPrice) {
      try {
        await pc.getHoldingByTicker([cryptoAccount], ticker)
        console.log(`found ${ticker}`)
        return asset
      } catch {
        console.log(`adding ${ticker}`)
        await pc.addHolding(
          PC_HOLDING_ACCOUNT_NAME,
          ticker,
          '',
          asset.balance,
          asset.usdPrice
        )
        await timeout(8000)
        return false
      }
    }
    return false
  })

  return existingAssets
}

async function updateBalances(cryptoAccount, assets) {
  await asyncForEach(assets, async asset => {
    const ticker = formatTicker(asset.ticker)
    console.log(`updating ${ticker}`)
    await pc.updateHolding(
      [cryptoAccount],
      ticker,
      asset.balance,
      asset.usdPrice
    )
    await timeout(8000)
  })
}

const main = async () => {
  await authWithPersonalCapital()

  const walletData = await cryptoBalances.getBalances(userWallets)
  const pcAccounts = await pc.getAccounts()

  const cryptoAccount = pcAccounts.filter(
    account => account.name === PC_HOLDING_ACCOUNT_NAME
  )[0]

  const existingAssets = await createAssetsThatDoNotExist(
    cryptoAccount,
    walletData
  )
  await updateBalances(cryptoAccount, existingAssets)

  return ''
}

main().then(() => process.exit())
