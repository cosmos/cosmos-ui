let test = require(`tape-promise/tape`)
let { getApp, restart } = require(`./launch.js`)
let { navigate, login } = require(`./common.js`)
// let { navigate, waitForValue, login } = require("./common.js") // removed because of linting, add back when optimistic updates come
/*
* NOTE: don't use a global `let client = app.client` as the client object changes when restarting the app
*/

test(`staking`, async function(t) {
  let { app } = await getApp(t)
  // app.env.COSMOS_MOCKED = false
  await restart(app)

  await login(app, `testkey`)
  await navigate(app, `Staking`)

  // default values from e2e mounted node
  let totalUserStake = 150
  let bondedStake = 100

  t.test(`Validators`, async function(t) {
    // Select the Validators tab.
    await app.client.$(`.delegates-tabs`).click(`a=Validators`)

    t.equal(
      (await app.client.$$(`.li-validator`)).length,
      3,
      `it shows all three validators`
    )
    await t.ok(
      await app.client.$(`.top=local_1`).isVisible(),
      `show validator 1`
    )
    await t.ok(
      await app.client.$(`.top=local_2`).isVisible(),
      `show validator 2`
    )
    await t.ok(
      await app.client.$(`.top=local_3`).isVisible(),
      `show validator 3`
    )
    await t.equal(
      parseFloat(
        await app.client.$(`.li-validator__value.your-votes`).getText()
      ),
      parseFloat(bondedStake),
      `show my stake in the validator`
    )

    t.end()
  })

  t.test(`bonding`, async function(t) {
    // validator should already be in the cart so we only need to click a button to go to the bonding view
    await app.client.$(`#go-to-bonding-btn`).click()
    // the unbonded atoms are equal to the total owned stake minus the bonded atoms (150 - 100 == 50)
    t.equal(
      await app.client.$(`#new-unbonded-atoms`).getValue(),
      (totalUserStake - bondedStake).toString(),
      `Left over steak shows correctly`
    )
    t.equal(
      await app.client.$(`.bond-candidate .bond-value__input`).getValue(),
      bondedStake.toString(),
      `Candidate bond matches current bond`
    )

    await app.client
      .$(`.bond-candidate .bond-value__input`)
      .setValue(bondedStake + 20)
    t.equal(
      await app.client.$(`#new-unbonded-atoms`).getValue(),
      (totalUserStake - bondedStake - 20).toString(),
      `Left over steak shows correctly after adjusting bond`
    )

    await app.client.$(`#btn-bond`).click()

    // should fail
    t.ok(await app.client.isVisible(`.tm-form-msg--error`), `shows error`)

    await app.client.$(`#bond-confirm`).click()
    await app.client.$(`#btn-bond`).click()

    t.ok(!(await app.client.isVisible(`.tm-form-msg--error`)), `hides error`)

    bondedStake += 20

    // wait until the validators are showing again
    await app.client.waitForVisible(`#go-to-bonding-btn`, 30000)
    // TODO: re-enable once we've added back optimistic updates
    // t.equal(
    //   await app.client.$(".li-validator__value.your-votes").getText(),
    //   bondedStake.toString(),
    //   "Delegate steak in validator updated correctly"
    // )

    t.end()
  })

  t.test(`unbonding`, async function(t) {
    // validator should already be in the cart so we only need to click a button to go to the bonding view
    await app.client.$(`#go-to-bonding-btn`).click()
    // the unbonded atoms are equal to the total owned stake minus the bonded atoms (150 - 100 == 50)
    //TOD: re-enable after optimistic loading (or actual loading) update
    // t.ok(
    //   await waitForValue(
    //     () => app.client.$("#new-unbonded-atoms"),
    //     (totalUserStake - bondedStake).toString()
    //   ),
    //   "Left over steak shows correctly"
    // )
    // the bonded amount should show 120
    // t.equal(
    //   await app.client.$(".bond-candidate .bond-value__input").getValue(),
    //   bondedStake.toString(),
    //   "Candidate bond matches current bond"
    // )

    // the bonded candidate is lowered by 20 stake
    // this is reflected correctly in the unbonded atoms section (50 - 20 === 30)
    await app.client
      .$(`.bond-candidate .bond-value__input`)
      .setValue(bondedStake - 20)
    //TOD: re-enable after optimistic loading (or actual loading) update
    // t.equal(
    //   await app.client.$("#new-unbonding-atoms").getValue(),
    //   (20).toString(),
    //   "Unbonding steak shows correctly"
    // )

    await app.client.$(`#btn-bond`).click()

    // should fail
    t.ok(await app.client.isVisible(`.tm-form-msg--error`), `shows error`)

    await app.client.$(`#bond-confirm`).click()
    await app.client.$(`#btn-bond`).click()

    t.ok(!(await app.client.isVisible(`.tm-form-msg--error`)), `hides error`)

    bondedStake -= 20

    // wait until the validators are showing again
    // await app.client.waitForVisible("#go-to-bonding-btn", 30000)
    // TODO: Update when we fix the optimistic ui changes again
    // t.equal(
    //   await app.client.$(".li-validator__value.your-votes").getText(),
    //   bondedStake.toString(),
    //   "Delegate steak in validator updated correctly"
    // )

    t.end()
  })

  t.end()
})
