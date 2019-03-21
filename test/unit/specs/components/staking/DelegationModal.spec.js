"use strict"

import { shallowMount, createLocalVue } from "@vue/test-utils"
import DelegationModal from "staking/DelegationModal"
import Vuelidate from "vuelidate"
import lcdClientMock from "renderer/connectors/lcdClientMock.js"

describe(`DelegationModal`, () => {
  let wrapper
  const { stakingParameters } = lcdClientMock.state
  const localVue = createLocalVue()
  localVue.use(Vuelidate)

  const getters = {
    connection: { connected: true },
    session: {
      signedIn: true,
      address: `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`
    },
    delegates: { delegates: lcdClientMock.state.candidates },
    stakingParameters: { parameters: stakingParameters }
  }

  beforeEach(() => {
    wrapper = shallowMount(DelegationModal, {
      localVue,
      mocks: {
        $store: { getters }
      },
      propsData: {
        validator: lcdClientMock.state.candidates[0],
        fromOptions: [
          {
            address: `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`,
            key: `My Wallet - cosmos…3p4mqpjyrm5ctpesxxn9`,
            maximum: 1000000000,
            value: 0
          },
          {
            address: lcdClientMock.state.candidates[0].operator_address,
            key: `Billy the Bill - cosmos…psjr9565ef72pv9g20yx`,
            maximum: 23.0484375481,
            value: 1
          },
          {
            address: `cosmos18thamkhnj9wz8pa4nhnp9rldprgant57ryzag7`,
            key: `Kentucky - cosmos…np9rldprgant57ryzag7`,
            maximum: 1.3788878447,
            value: 2
          }
        ],
        to: `cosmosvaladdr15ky9du8a2wlstz6fpx3p4mqpjyrm5ctplpn3au`,
        denom: stakingParameters.parameters.bond_denom
      }
    })
  })

  it(`should display the delegation modal form`, async () => {
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`opens`, () => {
    const $refs = { actionModal: { open: jest.fn() } }
    DelegationModal.methods.open.call({ $refs })
    expect($refs.actionModal.open).toHaveBeenCalled()
  })

  it(`clears on close`, () => {
    const self = {
      $v: { $reset: jest.fn() },
      selectedIndex: 1,
      amount: 10
    }
    DelegationModal.methods.clear.call(self)
    expect(self.$v.$reset).toHaveBeenCalled()
    expect(self.selectedIndex).toBe(0)
    expect(self.amount).toBeNull()
  })

  describe(`validation`, () => {
    describe(`fails`, () => {
      it(`with default values`, () => {
        expect(wrapper.vm.validateForm()).toBe(false)
      })

      it(`if the user manually inputs a number greater than the balance`, () => {
        wrapper.setData({ amount: 1420 })
        expect(wrapper.vm.validateForm()).toBe(false)
      })
    })

    describe(`succeeds`, () => {
      it(`if the amount is positive and the user has enough balance`, () => {
        wrapper.setData({ amount: 50 })
        expect(wrapper.vm.validateForm()).toBe(true)
      })
    })
  })

  describe(`submitForm`, () => {
    let session, submitDelegation, submitRedelegation
    beforeEach(() => {
      session = { address: `cosmos1address` }
      submitDelegation = jest.fn()
      submitRedelegation = jest.fn()
    })

    it(`should submit a delegation`, async () => {
      const from = `cosmos1address`

      await DelegationModal.methods.submitForm.call(
        {
          session,
          from,
          submitDelegation,
          submitRedelegation
        },
        `local`, `1234567890`
      )
      expect(submitDelegation).toHaveBeenCalledWith(`local`, `1234567890`)
      expect(submitRedelegation).not.toHaveBeenCalledWith(`local`, `1234567890`)
    })

    it(`should submit a redelegation`, async () => {
      const from = `cosmosvaloper1address`

      await DelegationModal.methods.submitForm.call(
        {
          session,
          from,
          submitDelegation,
          submitRedelegation
        },
        `local`, `1234567890`
      )
      expect(submitDelegation).not.toHaveBeenCalledWith(`local`, `1234567890`)
      expect(submitRedelegation).toHaveBeenCalledWith(`local`, `1234567890`)
    })
  })

  describe(`submitDelegation`, () => {
    it(`should delegate`, async () => {

      const $store = {
        dispatch: jest.fn(),
        commit: jest.fn()
      }
      const validator = { operator_address: `cosmosvaloper1address` }
      const amount = 50

      await DelegationModal.methods.submitDelegation.call(
        { $store, amount, validator, denom: `atom` },
        `local`, `1234567890`
      )

      expect($store.dispatch).toHaveBeenCalledWith(`submitDelegation`,
        {
          amount: `50000000`,
          validator_address: validator.operator_address,
          password: `1234567890`,
          submitType: `local`
        }
      )

      expect($store.commit).toHaveBeenCalledWith(`notify`,
        {
          body: `You have successfully delegated your atoms`,
          title: `Successful delegation!`
        }
      )
    })
  })

  describe(`submitRedelegation`, () => {
    it(`should redelegate`, async () => {

      const $store = {
        dispatch: jest.fn(),
        commit: jest.fn()
      }
      const validator = { operator_address: `cosmosvaloper1address` }
      const delegates = {
        delegates:
          [
            { operator_address: `cosmosvaloper1address2` }
          ]
      }
      const from = `cosmosvaloper1address2`
      const amount = 50

      await DelegationModal.methods.submitRedelegation.call(
        { $store, amount, validator, delegates, from, denom: `atom` },
        `local`, `1234567890`
      )

      expect($store.dispatch).toHaveBeenCalledWith(`submitRedelegation`,
        {
          amount: `50000000`,
          validatorSrc: delegates.delegates[0],
          validatorDst: validator,
          password: `1234567890`,
          submitType: `local`
        }
      )

      expect($store.commit).toHaveBeenCalledWith(`notify`,
        {
          body: `You have successfully redelegated your atoms`,
          title: `Successful redelegation!`
        }
      )
    })
  })
})
