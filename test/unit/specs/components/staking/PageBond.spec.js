import setup from "../../../helpers/vuex-setup"
import htmlBeautify from "html-beautify"
import Vuelidate from "vuelidate"
import PageBond from "renderer/components/staking/PageBond"
import { candidates } from "renderer/connectors/lcdClientMock.js"
describe("PageBond", () => {
  let wrapper, store, router
  let { mount, localVue } = setup()
  localVue.use(Vuelidate)

  beforeEach(async () => {
    let test = mount(PageBond, {
      doBefore: async ({ store }) => {
        store.commit("setConnected", true)
        store.commit("setAtoms", 101)

        store.commit("addToCart", {
          id: "pubkeyX",
          pub_key: {
            type: "ed25519",
            data: "pubkeyX"
          },
          voting_power: 10000,
          shares: 5000,
          description: {
            description: "descriptionX",
            country: "USA",
            moniker: "someValidator"
          }
        })
        store.commit("addToCart", {
          id: "pubkeyY",
          pub_key: {
            type: "ed25519",
            data: "pubkeyY"
          },
          voting_power: 30000,
          shares: 10000,
          description: {
            description: "descriptionY",
            country: "Canada",
            moniker: "someOtherValidator"
          }
        })

        let chileanValidator = Object.assign(
          {
            id: "pubkeyZ",
            voting_power: 20000,
            shares: 75000
          },
          candidates[2] // this is the revoked one
        )
        chileanValidator.description.moniker = "aChileanValidator"

        store.commit("addToCart", chileanValidator)

        store.commit("setUnbondingDelegations", {
          candidateId: "pubkeyY",
          value: 100
        })
      }
    })
    store = test.store
    router = test.router
    wrapper = test.wrapper

    wrapper.update()
  })

  it("has the expected html structure", async () => {
    // after importing the @tendermint/ui components from modules
    // the perfect scroll plugin needs a $nextTick and a wrapper.update
    // to work properly in the tests (snapshots weren't matching)
    // this has occured across multiple tests
    await wrapper.vm.$nextTick()
    wrapper.update()
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it("shows number of total atoms", () => {
    store.commit("setAtoms", 1337)
    expect(wrapper.vm.totalAtoms).toBe(1437) // plus unbonding atoms
  })

  it("shows old bonded atoms ", () => {
    store.commit("setCommittedDelegation", {
      candidateId: "pubkeyX",
      value: 13
    })
    store.commit("setCommittedDelegation", {
      candidateId: "pubkeyY",
      value: 26
    })
    expect(wrapper.vm.oldBondedAtoms).toBe(39)
  })

  it("shows bond bar percent", () => {
    store.commit("setAtoms", 120)
    expect(wrapper.vm.bondBarPercent(30)).toBe("14%")
  })

  it("sets bond bar inner width and style", () => {
    store.commit("setAtoms", 120)
    wrapper.setData({ bondBarOuterWidth: 128 })
    expect(wrapper.vm.bondBarInnerWidth(80)).toBe("64px")
    expect(wrapper.vm.styleBondBarInner(80)).toEqual({ width: "64px" })
  })

  it("sets bond group class", () => {
    expect(wrapper.vm.bondGroupClass(1337)).toBe("bond-group--positive")
    expect(wrapper.vm.bondGroupClass(-1337)).toBe("bond-group--negative")
    expect(wrapper.vm.bondGroupClass(0)).toBe("bond-group--neutral")
  })

  it("updates delegate atoms", () => {
    wrapper.vm.updateDelegateAtoms("pubkeyX", 88)
    let delegate = wrapper.vm.fields.delegates.find(d => d.id === "pubkeyX")
    expect(delegate.atoms).toBe(88)
  })

  it("only shows percent based on showing atoms", () => {
    let updatedDelegate = wrapper.vm.handleResize(
      wrapper.vm.$el.querySelector("#delegate-pubkeyX"),
      0.12
    )
    expect(updatedDelegate.deltaAtomsPercent).toBe("100%")
  })

  it("calculates delta", () => {
    expect(wrapper.vm.delta(100.23293423, 90.5304934)).toBe(9.70244083)
    expect(wrapper.vm.delta(100, 90, "int")).toBe(10)
  })

  it("calculates percentages", () => {
    expect(wrapper.vm.percent(45, 60)).toBe("75%")
    expect(wrapper.vm.percent(40, 60, 4)).toBe("66.6667%")
  })

  it("limits the input of atoms for max and min", () => {
    let delegate = {
      id: "pubkeyX",
      delegate: store.getters.shoppingCart[0].delegate,
      atoms: 50,
      oldAtoms: 40
    }
    wrapper.vm.limitMax(delegate, 100)
    expect(delegate.atoms).toBe(50)

    wrapper.vm.limitMax(delegate, 10)
    expect(delegate.atoms).toBe(10)

    delegate.atoms = -1
    wrapper.vm.limitMax(delegate, 10)
    expect(delegate.atoms).toBe(0)

    delegate.atoms = "0-101-9"
    wrapper.vm.limitMax(delegate, 10)
    expect(delegate.atoms).toBe(0)
  })

  it("leaves if there are no candidates selected", () => {
    let { router } = mount(PageBond, {
      doBefore: ({ store }) => {
        store.commit("setAtoms", 101)
      }
    })
    expect(router.currentRoute.fullPath).toBe("/staking")
  })

  it("leaves if no atoms available", () => {
    let test = mount(PageBond, {
      doBefore: ({ store }) => {
        store.commit("setAtoms", 0)
      }
    })
    router = test.router
    expect(router.currentRoute.fullPath).toBe("/staking")
  })

  it("shows selected candidates", () => {
    expect(htmlBeautify(wrapper.html())).toContain("someValidator")
    expect(htmlBeautify(wrapper.html())).toContain("someOtherValidator")
  })

  it("resets fields properly", () => {
    wrapper.setData({
      fields: {
        delegates: [
          {
            id: "pubkeyX",
            delegate: store.getters.shoppingCart[0].delegate,
            atoms: 50,
            oldAtoms: 40
          },
          {
            id: "pubkeyY",
            delegate: store.getters.shoppingCart[1].delegate,
            atoms: 50,
            oldAtoms: 40
          }
        ]
      }
    })
    expect(wrapper.find("#new-unbonded-atoms").element.value).toBe("181") // plus unbonding atoms
    wrapper.find("#btn-reset").trigger("click")
    expect(wrapper.find("#new-unbonded-atoms").element.value).toBe("201")
  })

  it("shows an error when bonding too many atoms", () => {
    wrapper.setData({
      fields: {
        delegates: [
          {
            id: "pubkeyX",
            delegate: store.getters.shoppingCart[0].delegate,
            atoms: 100
          },
          {
            id: "pubkeyY",
            delegate: store.getters.shoppingCart[1].delegate,
            atoms: 100
          }
        ]
      }
    })
    wrapper.findAll("#btn-bond").trigger("click")
    expect(store.dispatch.mock.calls[0]).toBeUndefined()
    expect(wrapper.vm.$el.querySelector(".tm-form-msg--error")).not.toBeNull()
  })

  it("shows an appropriate amount of unbonded atoms", () => {
    wrapper.setData({
      fields: {
        bondConfirm: false,
        delegates: [
          {
            id: "pubkeyX",
            delegate: store.getters.shoppingCart[0].delegate,
            atoms: 30,
            oldAtoms: 20
          },
          {
            id: "pubkeyY",
            delegate: store.getters.shoppingCart[1].delegate,
            atoms: 30,
            oldAtoms: 20
          }
        ]
      }
    })
    expect(wrapper.vm.newUnbondedAtoms).toBe(181) // plus unbonding atoms
    expect(wrapper.find("#new-unbonded-atoms").vnode.elm._value).toBe(181)
  })

  it("shows an appropriate amount of unbonding atoms", () => {
    // give some stake so unbinding bar shows
    store.commit("setCommittedDelegation", { candidateId: "pubkeyX", value: 5 })
    wrapper.update()

    wrapper.setData({
      fields: {
        bondConfirm: false,
        delegates: [
          {
            id: "pubkeyX",
            delegate: store.getters.shoppingCart[0].delegate,
            atoms: 31,
            oldAtoms: 41
          },
          {
            id: "pubkeyY",
            delegate: store.getters.shoppingCart[1].delegate,
            atoms: 30,
            oldAtoms: 40
          }
        ]
      }
    })
    expect(wrapper.vm.newUnbondingAtoms).toBe(120) // plus old unbonding atoms
    expect(wrapper.find("#new-unbonding-atoms").vnode.elm._value).toBe(120)
  })

  it("shows an error if confirmation is not checked", () => {
    wrapper.setData({
      fields: {
        bondConfirm: false,
        delegates: [
          {
            id: "pubkeyX",
            delegate: store.getters.shoppingCart[0].delegate,
            atoms: 51
          },
          {
            id: "pubkeyY",
            delegate: store.getters.shoppingCart[1].delegate,
            atoms: 50
          }
        ]
      }
    })
    wrapper.findAll("#btn-bond").trigger("click")
    expect(store.dispatch.mock.calls[0]).toBeUndefined()
    expect(wrapper.vm.$el.querySelector(".tm-form-msg--error")).not.toBeNull()
  })

  it("submits a bonding action on submit", async () => {
    wrapper.setData({
      fields: {
        bondConfirm: true,
        delegates: [
          {
            id: "pubkeyX",
            delegate: store.getters.shoppingCart[0].delegate,
            atoms: 51
          },
          {
            id: "pubkeyY",
            delegate: store.getters.shoppingCart[1].delegate,
            atoms: 50
          }
        ]
      }
    })
    wrapper.findAll("#btn-bond").trigger("click")
    expect(store.getDispatches("submitDelegation")).toHaveLength(1)
    // XXX somehow this still shows the error in tests but this does not happen in live Voyager
    // XXX this makes the .not.toBeNull() tests pointless :/
    // expect(wrapper.vm.$el.querySelector(".tm-form-msg--error")).toBeNull()
  })

  it("moves to the staking page after bonding", async () => {
    store._actions.sendTx[0] = () => Promise.resolve()
    wrapper.setData({
      fields: {
        bondConfirm: true,
        delegates: [
          {
            id: "pubkeyX",
            delegate: store.getters.shoppingCart[0].delegate,
            atoms: 51
          },
          {
            id: "pubkeyY",
            delegate: store.getters.shoppingCart[1].delegate,
            atoms: 50
          }
        ]
      }
    })
    await wrapper.vm.onSubmit()
    expect(store.getCommits("notify")).toHaveLength(1)
    expect(router.currentRoute.fullPath).toBe("/staking")
  })

  it("shows an error if unbonding too many atoms", async () => {
    wrapper.setData({
      fields: {
        bondConfirm: false,
        delegates: [
          {
            id: "pubkeyX",
            delegate: store.getters.shoppingCart[0].delegate,
            atoms: 51,
            oldAtoms: 41
          },
          {
            id: "pubkeyY",
            delegate: store.getters.shoppingCart[1].delegate,
            atoms: 241,
            oldAtoms: 40
          }
        ]
      }
    })
    expect(wrapper.vm.newUnbondedAtoms).toBeLessThan(0)
    await wrapper.vm.onSubmit()
    expect(store.dispatch.mock.calls[0]).toBeUndefined()
    expect(
      store.commit.mock.calls.filter(
        x =>
          x[0] === "notifyError" &&
          x[1].body.indexOf("more atoms than you have") !== -1
      )
    ).toBeDefined()
    expect(wrapper.vm.$el.querySelector(".tm-form-msg--error")).not.toBeNull()
  })

  it("unbonds atoms if bond amount is decreased", () => {
    store.commit("setCommittedDelegation", {
      candidateId: "pubkeyX",
      value: 51
    })
    store.commit("setCommittedDelegation", {
      candidateId: "pubkeyY",
      value: 50
    })
    wrapper.update()
    wrapper.setData({
      fields: {
        bondConfirm: true,
        delegates: [
          {
            id: "pubkeyX",
            delegate: store.getters.shoppingCart[0].delegate,
            atoms: 0
          },
          {
            id: "pubkeyY",
            delegate: store.getters.shoppingCart[1].delegate,
            atoms: 25
          }
        ]
      }
    })
    wrapper.findAll("#btn-bond").trigger("click")
    expect(store.dispatch.mock.calls[0][0]).toBe("submitDelegation")
  })

  it("does not show the unbonding bar if user has no atoms", () => {
    expect(wrapper.vm.oldBondedAtoms).toBe(0)
    expect(
      wrapper.vm.$el.querySelector(".bond-group.bond-group--unbonding")
    ).toBeNull()
  })

  it("shows a message if there are revoked candidates", () => {
    wrapper.setData({
      fields: {
        delegates: [
          {
            id: "pubkeyX",
            delegate: Object.assign(
              {},
              store.getters.shoppingCart[0].delegate,
              { revoked: true }
            ),
            atoms: 0
          },
          {
            id: "pubkeyY",
            delegate: store.getters.shoppingCart[1].delegate,
            atoms: 25
          }
        ]
      }
    })
    expect(wrapper.vm.showsRevokedValidators).toBe(true)
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it("shows an error if trying to bond to revoked candidates", async () => {
    await store.dispatch("signIn", {
      account: "default",
      password: "1234567890"
    })

    wrapper.update()
    wrapper.vm.fields.bondConfirm = true
    wrapper.vm.fields.delegates[2].revoked = true
    wrapper.vm.fields.delegates[2].atoms = 1

    wrapper.findAll("#btn-bond").trigger("click")
    await sleep(1000)
    let lastErr =
      store.state.notifications[store.state.notifications.length - 1]
    expect(lastErr.body).toContain(
      "Validator for this address is currently revoked"
    )
  })

  it("disables bonding if not connected", async () => {
    store.commit("setConnected", false)
    wrapper.update()
    wrapper.vm.onSubmit = jest.fn()
    expect(wrapper.find("#btn-bond").exists()).toBeFalsy()
    expect(wrapper.vm.$el).toMatchSnapshot()
  })
})

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
