const { PersonalCapital } = require('personalcapital-js-telegram')
const { asyncForEach, timeout, formatTicker } = require('./utils')
const CryptoBalances = require('crypto-and-token-balances')
const tcfs = require('tough-cookie-file-store')
const request = require('request-promise-native')

class PersonalCapitalCrypto {
  constructor(credentials) {
    Object.assign(this, credentials)

    this.cryptoBalances = new CryptoBalances(
      this.COINMARKETCAP_API_KEY,
      this.ETHPLORER_API_KEY,
      this.BLOCKONOMICS_API_KEY
    )
    
    this.pc = new PersonalCapital(
      'pcjs',
      request.jar(new tcfs('./pc-cookie.json')),
      this.TELEGRAM_TOKEN,
      this.TELEGRAM_CHAT_ID
    )
  }


  async authWithPersonalCapital() {
    console.log('starting')
    try {
      await this.pc.auth(this.PERSONAL_CAPITAL_USERNAME, this.PERSONAL_CAPITAL_PASSWORD)
    } catch(e) {
      console.log(e)
      throw 'Failed to auth with personal capital!'
    }
    console.log('auth complete')
  }

  async createAssetsThatDoNotExist(cryptoAccount, walletData) {
    const pcHoldingAccountName = this.PC_HOLDING_ACCOUNT_NAME
    await asyncForEach(walletData, async asset => {
      const ticker = formatTicker(asset.ticker)
      if (asset.usdPrice) {
        try {
          await this.pc.getHoldingByTicker([cryptoAccount], ticker)
          console.log(`found ${ticker}`)
        } catch {
          console.log(`adding ${ticker}`)
          try {
            await this.pc.addHolding(
              pcHoldingAccountName,
              ticker,
              '',
              asset.balance,
              asset.usdPrice
            )
          } catch(e) {
            console.log(`failed to add ${ticker}`, e)
          }
          
          await timeout(8000)
        }
      }
    })
  }

  async updateBalances(cryptoAccount, assets) {
    await asyncForEach(assets, async asset => {
      if (asset.usdPrice) {
        const ticker = formatTicker(asset.ticker)
        console.log(`updating ${ticker}`)
        try {
          await this.pc.updateHolding(
            [cryptoAccount],
            ticker,
            asset.balance,
            asset.usdPrice
          )
          console.log(`updated ${ticker}!`)
        } catch(e) {
          console.log(`failed to update ${ticker}`, e)
        }
        await timeout(8000)
      }
    })
  }

  async updateAssetsInPersonalCapital(userWallets) {
    await this.authWithPersonalCapital()

    const walletData = await this.cryptoBalances.getBalances(userWallets)
    const pcAccounts = await this.pc.getAccounts()

    const cryptoAccount = pcAccounts.filter(
      account => account.name === this.PC_HOLDING_ACCOUNT_NAME
    )[0]

    if (cryptoAccount) {
      await this.createAssetsThatDoNotExist(cryptoAccount, walletData)
      await this.updateBalances(cryptoAccount, walletData)
      console.log('Finished updating accounts!')
      console.log()
    } else {
      console.log(
        `Personal Capital account ${this.PC_HOLDING_ACCOUNT_NAME} not found!`
      )
    }
    return 
  }

}

module.exports = PersonalCapitalCrypto
