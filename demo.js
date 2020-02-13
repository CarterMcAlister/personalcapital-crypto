const userWallets = require('./wallets.json')
const PersonalCapitalCrypto = require('./index')
const credentials = require('./credentials.json')

const personalCapitalCrypto = new PersonalCapitalCrypto(credentials)

async function main() {
    try {
        await personalCapitalCrypto.updateAssetsInPersonalCapital(userWallets)
        console.log('Updated assets!')
    } catch(e) {
        console.log('Failed to update assets!', e)
    }
}

main()
