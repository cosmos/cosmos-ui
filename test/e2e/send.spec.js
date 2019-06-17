const { actionModalCheckout } = require("./helpers.js")

module.exports = {
  "Send Action": async function(browser) {
    // move to according page
    browser.url(browser.launch_url + "/#/wallet")

    // open modal and enter amount
    browser
      .waitForElementVisible(`#li-coin--stake`)
      .click("#li-coin--stake button")
      .waitForElementVisible(`#send-modal`)

    actionModalCheckout(
      browser,
      // actions to do on details page
      () => {
        browser
          .setValue(
            "#send-address",
            "cosmos1v9zf9klj57rfsmdyamza5jqh9p46m3dlvq847j"
          )
          .setValue("#amount", "1.3")
      },
      // expected subtotal
      "1.3"
    )

    // check if tx shows
    browser
      .url(browser.launch_url + "/#/transactions")
      .expect.element(".li-tx__content__caption__title")
      .text.to.contain("Sent 1.3 STAKE")
      .before(10 * 1000)
  }
}
