let test = require("tape-promise/tape")
let { getApp, refresh } = require("./launch.js")
let { openMenu, login, sleep } = require("./common.js")

/*
* NOTE: For some strange reason element.click() does not always work. In some cases I needed to use client.leftClick(selector). But this will be deprecated and pollutes the console with a deprecation warning.
*/

/*
* NOTE: don't use a global `let client = app.client` as the client object changes when restarting the app
*/

test("sign in", async function(t) {
  let { app } = await getApp(t)

  await refresh(app)
  let el = (...args) => app.client.$(...args)
  // clicking the button does fail in webdriver as there is no actual click handler on the button
  async function clickContinue() {
    return app.client.submitForm(".tm-session form")
  }

  t.test("signup", async function(t) {
    await app.client.waitForExist(".tm-session-title=Sign In", 10000)

    // go to login selection
    await app.client
      .$("i=arrow_back")
      .$("..")
      .click()
    await app.client.waitForExist(".tm-li-session", 1000)
    // go to new account
    await app.client
      .$(".tm-li-session-title=Create new account")
      .$("..")
      .$("..")
      .click()

    await sleep(500) // circleci error where the checkbox somehow isn't ready to be clicked yet

    let accountName = () => el("#sign-up-name")
    let password = () => el("#sign-up-password")
    let passwordConfirm = () => el("#sign-up-password-confirm")
    let warning = () => el("#sign-up-warning")

    t.test("did check warning", async function(t) {
      await clickContinue()
      t.ok(
        await warning()
          .$("..")
          .$("..")
          .$("..")
          .isExisting(".tm-form-msg--error"),
        "shows error"
      )
      await warning().click()
      t.ok(
        !(await warning()
          .$("..")
          .$("..")
          .$("..")
          .isExisting(".tm-form-msg--error")),
        "hides error"
      )
      t.end()
    })

    t.test("set account name", async function(t) {
      await clickContinue()
      t.ok(
        await accountName()
          .$("..")
          .isExisting(".tm-form-msg--error"),
        "shows error"
      )
      await app.client.leftClick("#sign-up-name")
      await app.client.keys("sign".split())
      t.ok(
        await accountName()
          .$("..")
          .isExisting(".tm-form-msg--error"),
        "shows error for too few letters"
      )
      await app.client.leftClick("#sign-up-name")
      await app.client.keys("in_test".split())
      t.ok(
        !(await accountName()
          .$("..")
          .isExisting(".tm-form-msg--error")),
        "hides error"
      )
      t.end()
    })

    t.test("set password", async function(t) {
      await clickContinue()
      t.ok(
        await password()
          .$("..")
          .isExisting(".tm-form-msg--error"),
        "shows error"
      )
      await password().click()
      await app.client.keys("1234".split())
      t.ok(
        await password()
          .$("..")
          .isExisting(".tm-form-msg--error"),
        "shows error for too few letters"
      )
      await password().click()
      await app.client.keys("567890".split())
      t.ok(
        !(await password()
          .$("..")
          .isExisting(".tm-form-msg--error")),
        "hides error"
      )
      t.end()
    })

    t.test("confirm password", async function(t) {
      await clickContinue()
      t.ok(
        await passwordConfirm()
          .$("..")
          .isExisting(".tm-form-msg--error"),
        "shows error"
      )
      await passwordConfirm().click()
      await app.client.keys("1234".split())
      t.ok(
        await passwordConfirm()
          .$("..")
          .isExisting(".tm-form-msg--error"),
        "shows error for not matching passwords"
      )
      await passwordConfirm().click()
      await app.client.keys("567890".split())
      t.ok(
        !(await passwordConfirm()
          .$("..")
          .isExisting(".tm-form-msg--error")),
        "hides error"
      )
      t.end()
    })

    t.test("logs in", async function(t) {
      await clickContinue()

      // checking if user is logged in
      await app.client.waitForExist("#app-content", 10000)
      await openMenu(app)
      let activeUser = await app.client
        .$(".tm-li-user .tm-li-subtitle")
        .getText()
      t.ok(activeUser === "signin_test", "user is logged in")

      t.end()
    })
    t.end()
  })

  t.test("sign out", async function(t) {
    await refresh(app)
    await login(app, "testkey")
    await app.client.waitForExist(".material-icons=exit_to_app", 1000)
    await app.client
      .$(".material-icons=exit_to_app")
      .$("..")
      .click()

    await app.client.waitForExist(".tm-session", 1000)

    t.end()
  })

  t.test("seed", async function(t) {
    await refresh(app)
    // go to login selection
    await app.client
      .$("i=arrow_back")
      .$("..")
      .click()
    await app.client.waitForExist(".tm-li-session", 1000)
    // go to import with seed
    await app.client
      .$(".tm-li-session-title=Import with seed")
      .$("..")
      .$("..")
      .click()

    let accountName = () => el("#import-name")
    let password = () => el("#import-password")
    let passwordConfirm = () => el("#import-password-confirmation")
    let seed = () => el("#import-seed")

    t.test("set account name", async function(t) {
      await clickContinue()
      t.ok(
        await accountName()
          .$("..")
          .isExisting(".tm-form-msg--error"),
        "shows error"
      )
      await accountName().scroll()
      await accountName().click()
      await app.client.keys("seed".split())
      t.ok(
        await accountName()
          .$("..")
          .isExisting(".tm-form-msg--error"),
        "shows error for too few letters"
      )
      await accountName().click()
      await app.client.keys("_test".split())
      t.ok(
        !(await accountName()
          .$("..")
          .isExisting(".tm-form-msg--error")),
        "hides error"
      )
      t.end()
    })

    t.test("set password", async function(t) {
      await clickContinue()
      t.ok(
        await password()
          .$("..")
          .isExisting(".tm-form-msg--error"),
        "shows error"
      )
      await password().click()
      await app.client.keys("1234".split())
      t.ok(
        await password()
          .$("..")
          .isExisting(".tm-form-msg--error"),
        "shows error for too few letters"
      )
      await password().click()
      await app.client.keys("567890".split())
      t.ok(
        !(await password()
          .$("..")
          .isExisting(".tm-form-msg--error")),
        "hides error"
      )
      t.end()
    })

    t.test("confirm password", async function(t) {
      await clickContinue()
      t.ok(
        await passwordConfirm()
          .$("..")
          .isExisting(".tm-form-msg--error"),
        "shows error"
      )
      await passwordConfirm().click()
      await app.client.keys("1234".split())
      t.ok(
        await passwordConfirm()
          .$("..")
          .isExisting(".tm-form-msg--error"),
        "shows error for not matching passwords"
      )
      await passwordConfirm().click()
      await app.client.keys("567890".split())
      t.ok(
        !(await passwordConfirm()
          .$("..")
          .isExisting(".tm-form-msg--error")),
        "hides error"
      )
      t.end()
    })

    t.test("input correct seed text", async function(t) {
      await clickContinue()
      t.ok(
        await seed()
          .$("..")
          .isExisting(".tm-form-msg--error"),
        "shows error"
      )
      await seed().click()
      await app.client.keys(
        "attack ocean crack fun say lawn display proof tiny traffic light expect gravity citizen split deer family bar mutual clown stage cook awake evoke".split()
      )
      t.ok(
        !(await seed()
          .$("..")
          .isExisting(".tm-form-msg--error")),
        "hides error"
      )
      t.end()
    })

    t.test("logs in", async function(t) {
      await clickContinue()

      // checking if user is logged in
      await app.client.waitForExist("#app-content", 5000)
      await openMenu(app)
      let activeUser = await app.client
        .$(".tm-li-user .tm-li-subtitle")
        .getText()
      t.equal(activeUser, "seed_test", "user is logged in")

      t.end()
    })

    t.end()
  })
  t.end()
})
