import { shallowMount, createLocalVue } from "@vue/test-utils"
import Vuelidate from "vuelidate"
import SendModal from "src/ActionModal/components/SendModal"

describe(`SendModal`, () => {
  const localVue = createLocalVue()
  localVue.use(Vuelidate)
  localVue.directive(`focus`, () => {})

  let wrapper, $store

  const balances = [
    {
      denom: `STAKE`,
      amount: 10000000000
    },
    {
      denom: `fermion`,
      amount: 2300
    }
  ]
  const getters = {
    wallet: {
      loading: false,
      denoms: [`fermion`, `gregcoin`, `mycoin`, `STAKE`],
      balances
    },
    connected: true,
    session: { signedIn: true, address: "cosmos1234" }
  }

  beforeEach(async () => {
    $store = {
      commit: jest.fn(),
      dispatch: jest.fn(),
      getters
    }

    wrapper = shallowMount(SendModal, {
      localVue,
      propsData: {
        denom: `STAKE`
      },
      mocks: {
        $store
      },
      sync: false
    })

    wrapper.vm.$refs.actionModal = {
      submit: cb => cb(),
      open: jest.fn()
    }
  })

  it(`should display send modal form`, async () => {
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`clears on close`, () => {
    const self = {
      $v: { $reset: jest.fn() },
      address: `cosmos1address`,
      amount: 10
    }
    SendModal.methods.clear.call(self)
    expect(self.$v.$reset).toHaveBeenCalled()
    expect(self.address).toBe(``)
    expect(self.amount).toBe(0)
  })

  it(`shows the memo input if desired`, () => {
    wrapper.setData({
      editMemo: true
    })

    expect(wrapper.exists("#memo")).toBe(true)
  })

  describe(`validation`, () => {
    it(`should show address required error`, async () => {
      wrapper.setData({
        denom: `STAKE`,
        address: ``,
        amount: 2
      })
      wrapper.vm.validateForm()
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.$v.$error).toBe(true)
      expect(wrapper.vm.$el).toMatchSnapshot()
    })
    it(`should show bech32 error when address length is too short`, async () => {
      wrapper.setData({
        denom: `STAKE`,
        address: `asdf`,
        amount: 2
      })
      wrapper.vm.validateForm()
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.$v.$error).toBe(true)
      expect(wrapper.vm.$el).toMatchSnapshot()
    })

    it(`should show bech32 error when address length is too long`, async () => {
      wrapper.setData({
        denom: `STAKE`,
        address: `asdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdf`,
        amount: 2
      })
      wrapper.vm.validateForm()
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.$v.$error).toBe(true)
      expect(wrapper.vm.$el).toMatchSnapshot()
    })
    it(`should show bech32 error when alphanumeric is wrong`, async () => {
      wrapper.setData({
        address: ``
      })
      expect(wrapper.vm.validateForm()).toBe(false)
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.$el).toMatchSnapshot()
    })
  })

  it(`validates bech32 addresses`, () => {
    expect(
      wrapper.vm.bech32Validate(`cosmos1x7wzdumfj8pncd99mqc0mkqfrrps3l3pjz8tk6`)
    ).toBe(true)
    expect(
      wrapper.vm.bech32Validate(`cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`)
    ).toBe(false)
  })

  it("should return transaction data in correct form", () => {
    wrapper.setData({
      denom: `STAKE`,
      address: `cosmos12345`,
      amount: 2
    })
    expect(wrapper.vm.transactionData).toEqual({
      type: "MsgSend",
      toAddress: "cosmos12345",
      amounts: [{ amount: "2000000", denom: "STAKE" }],
      memo: "(Sent via Lunie)"
    })
  })

  it("should return notification message", () => {
    wrapper.setData({
      denom: `STAKE`,
      address: `cosmos12345`,
      amount: 2
    })
    expect(wrapper.vm.notifyMessage).toEqual({
      title: `Successful Send`,
      body: `Successfully sent 2 STAKEs to cosmos12345`
    })
  })
})
