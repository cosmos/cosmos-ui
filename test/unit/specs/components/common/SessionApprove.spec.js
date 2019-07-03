import { createLocalVue, shallowMount } from "@vue/test-utils"
import Vuelidate from "vuelidate"
import SessionApprove from "common/SessionApprove"

describe(`SessionApprove`, () => {
  const localVue = createLocalVue()
  localVue.use(Vuelidate)

  let wrapper, $store

  beforeEach(() => {
    const getters = {
      signRequest: `{signMessage:{"account_number":"1","chain_id":"testnet","fee":{"amount":[{"amount":"40","denom":"stake"}],"gas":"39953"},"memo":"(Sent via Lunie)","msgs":[{"type":"cosmos-sdk/MsgSend","value":{"amount":[{"amount":"12000000","denom":"stake"}],"from_address":"cosmos1ek9cd8ewgxg9w5xllq9um0uf4aaxaruvcw4v9e","to_address":"cosmos1324vt5j3wzx0xsc32mjhkrvy5gn5ef2hrwcg29"}}],"sequence":"0"}}`
    }

    $store = {
      commit: jest.fn(),
      dispatch: jest.fn(),
      getters
    }
    wrapper = shallowMount(SessionApprove, {
      localVue,
      mocks: {
        $store
      }
    })
  })

  it(`shows the approval modal with the transaction and an invoice table`, () => {
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`should close`, () => {
    const self = {
      $emit: jest.fn()
    }
    SessionApprove.methods.close.call(self)
    expect(self.$emit).toHaveBeenCalledWith(`close`)
  })

  it("moves to other session pages", () => {
    const self = {
      $emit: jest.fn()
    }
    SessionApprove.methods.setState.call(self, "welcome")
    expect(self.$emit).toHaveBeenCalledWith("route-change", "welcome")
  })

  describe("approve", () => {
    it("fails if no password", async () => {
      wrapper.vm.close = jest.fn()
      wrapper.vm.password = ""
      wrapper.find("#approve-btn").trigger("click")
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.$store.dispatch).not.toHaveBeenCalled()
      expect(wrapper.vm.close).not.toHaveBeenCalled()
    })

    it("approves and closes", async () => {
      wrapper.vm.close = jest.fn()
      wrapper.vm.password = "1234"
      wrapper.find("#approve-btn").trigger("click")
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.$store.dispatch).toHaveBeenCalledWith(
        "approveSignRequest",
        { password: "1234", senderAddress: "cosmos1234", signMessage: "{}" }
      )
      expect(wrapper.vm.close).toHaveBeenCalled()
    })
  })

  it("rejects", async () => {
    wrapper.vm.close = jest.fn()
    wrapper.find("#reject-btn").trigger("click")
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.$store.dispatch).toHaveBeenCalledWith(
      "rejectSignRequest",
      `{signMessage:{"account_number":"1","chain_id":"testnet","fee":{"amount":[{"amount":"40","denom":"stake"}],"gas":"39953"},"memo":"(Sent via Lunie)","msgs":[{"type":"cosmos-sdk/MsgSend","value":{"amount":[{"amount":"12000000","denom":"stake"}],"from_address":"cosmos1ek9cd8ewgxg9w5xllq9um0uf4aaxaruvcw4v9e","to_address":"cosmos1324vt5j3wzx0xsc32mjhkrvy5gn5ef2hrwcg29"}}],"sequence":"0"}}`
    )
    expect(wrapper.vm.close).toHaveBeenCalled()
  })
})
