"use strict"

import Vuelidate from "vuelidate"
import { shallowMount, createLocalVue } from "@vue/test-utils"
import ModalVote from "renderer/components/governance/ModalVote"
import lcdClientMock from "renderer/connectors/lcdClientMock.js"

describe(`ModalVote`, () => {
  let wrapper, $store

  const localVue = createLocalVue()
  localVue.use(Vuelidate)

  beforeEach(() => {
    $store = {
      commit: jest.fn(),
      dispatch: jest.fn(),
      getters: {
        session: { signedIn: true },
        connection: { connected: true },
        bondDenom: `uatom`,
        liquidAtoms: 1000000
      }
    }
    wrapper = shallowMount(ModalVote, {
      localVue,
      propsData: {
        proposalId: `1`,
        proposalTitle: lcdClientMock.state.proposals[`1`].title
      },
      mocks: {
        $store
      }
    })
  })

  it(`should display vote modal form`, async () => {
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`opens`, () => {
    const $refs = { actionModal: { open: jest.fn() } }
    ModalVote.methods.open.call({ $refs })
    expect($refs.actionModal.open).toHaveBeenCalled()
  })

  it(`clears on close`, () => {
    const self = {
      $v: { $reset: jest.fn() },
      vote: `Yes`
    }

    ModalVote.methods.clear.call(self)
    expect(self.$v.$reset).toHaveBeenCalled()
    expect(self.vote).toBeNull()
  })

  describe(`validation`, () => {
    it(`fails`, () => {
      // default values
      expect(wrapper.vm.validateForm()).toBe(false)

      // non valid option value
      wrapper.setData({ vote: `other` })
      expect(wrapper.vm.validateForm()).toBe(false)
    })

    it(`succeeds`, async () => {
      wrapper.setData({ vote: `Yes` })
      expect(wrapper.vm.validateForm()).toBe(true)

      wrapper.setData({ vote: `No` })
      expect(wrapper.vm.validateForm()).toBe(true)

      wrapper.setData({ vote: `NoWithVeto` })
      expect(wrapper.vm.validateForm()).toBe(true)

      wrapper.setData({ vote: `Abstain` })
      expect(wrapper.vm.validateForm()).toBe(true)
    })
  })

  describe(`Disable already voted options`, () => {
    it(`disable button if equals the last vote: Abstain`, async () => {
      wrapper.setProps({ lastVoteOption: `Abstain` })
      await wrapper.vm.$nextTick()

      let voteBtn = wrapper.find(`#vote-yes`)
      expect(voteBtn.html()).not.toContain(`disabled="true"`)
      voteBtn = wrapper.find(`#vote-no`)
      expect(voteBtn.html()).not.toContain(`disabled="true"`)
      voteBtn = wrapper.find(`#vote-veto`)
      expect(voteBtn.html()).not.toContain(`disabled="true"`)
      voteBtn = wrapper.find(`#vote-abstain`)
      expect(voteBtn.html()).toContain(`disabled="true"`)
    })
  })

  describe(`Vote`, () => {
    it(`submits a vote on a proposal`, async () => {
      const $store = {
        dispatch: jest.fn(),
        commit: jest.fn()
      }

      await ModalVote.methods.submitForm.call(
        { proposalId: `1`, vote: `Yes`, $store },
        `ledger`, ``
      )

      expect($store.dispatch).toHaveBeenCalledWith(`submitVote`,
        {
          option: `Yes`,
          proposal_id: `1`,
          password: ``,
          submitType: `ledger`
        }
      )

      expect($store.commit).toHaveBeenCalledWith(`notify`,
        {
          body: `You have successfully voted Yes on proposal #1`,
          title: `Successful vote!`
        }
      )
    })
  })
})
