"use strict"

import moment from "moment"
import PageProposal from "renderer/components/governance/PageProposal"

import { proposals, tallies } from "../../store/json/proposals"
import { governanceParameters } from "../../store/json/parameters"
import { createLocalVue, shallowMount } from "@vue/test-utils"
import Vuex from "vuex"
import Vuelidate from "vuelidate"

const proposal = proposals[`2`]
const multiplier = 100000000

describe(`PageProposal`, () => {
  let wrapper, $store

  const getters = {
    depositDenom: governanceParameters.deposit.min_deposit[0].denom,
    proposals: { proposals, tallies },
    connected: true,
    governanceParameters: { ...governanceParameters, loaded: true },
    wallet: {
      address: `X`
    },
    session: {
      signedIn: true
    }
  }
  let args

  beforeEach(() => {
    const localVue = createLocalVue()
    localVue.use(Vuex)
    localVue.use(Vuelidate)
    localVue.directive(`tooltip`, () => {})
    localVue.directive(`focus`, () => {})

    $store = {
      commit: jest.fn(),
      dispatch: jest.fn(),
      getters
    }
    args = {
      localVue,
      propsData: {
        proposalId: `2`
      },
      mocks: {
        $store
      },
      stubs: {
        "modal-deposit": true,
        "modal-vote": true,
        "short-bech32": true
      }
    }
    wrapper = shallowMount(PageProposal, args)
  })

  describe(`has the expected html structure`, () => {
    it(`if user has signed in`, async () => {
      wrapper = shallowMount(PageProposal, args)
      expect(wrapper.vm.$el).toMatchSnapshot()
    })
  })

  it(`renders votes in HTML when voting is open`, async () => {
    $store = {
      commit: jest.fn(),
      dispatch: jest.fn(),
      getters: {
        ...getters,
        proposals: {
          proposals,
          tallies: {
            2: {
              yes: 10 * multiplier,
              no: 20 * multiplier,
              no_with_veto: 30 * multiplier,
              abstain: 40 * multiplier
            }
          }
        }
      }
    }
    wrapper = shallowMount(PageProposal, { ...args, mocks: { $store } })
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`shows an error if the proposal couldn't be found`, () => {
    wrapper = shallowMount(PageProposal, { ...args, propsData: { proposalId: `666` } })
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`should return the time of submission `, () => {
    expect(wrapper.vm.submittedAgo).toEqual(
      moment(new Date(proposal.submit_time)).fromNow()
    )
  })

  it(`should return the time that voting started`, () => {
    expect(wrapper.vm.votingStartedAgo).toEqual(
      moment(new Date(proposal.voting_start_time)).fromNow()
    )
  })

  it(`should return the time when deposits end`, () => {
    expect(wrapper.vm.depositEndsIn).toEqual(
      moment(new Date(proposal.deposit_end_time)).fromNow()
    )
  })

  describe(`Proposal status`, () => {
    it(`displays correctly a proposal that 'Passed'`, () => {
      wrapper.vm.proposal.proposal_status = `Passed`
      expect(wrapper.vm.status).toMatchObject({
        message: `This proposal has passed`
      })
    })

    it(`displays correctly a 'Rejected' proposal`, () => {
      wrapper.vm.proposal.proposal_status = `Rejected`
      expect(wrapper.vm.status).toMatchObject({
        message: `This proposal has been rejected and voting is closed`,
        color: `red`
      })
    })

    it(`displays correctly a proposal on 'DepositPeriod'`, () => {
      wrapper.vm.proposal.proposal_status = `DepositPeriod`
      expect(wrapper.vm.status).toMatchObject({
        message: `Deposits are open for this proposal`,
        color: `yellow`
      })
    })

    it(`displays correctly a proposal on 'VotingPeriod'`, () => {
      wrapper.vm.proposal.proposal_status = `VotingPeriod`
      expect(wrapper.vm.status).toMatchObject({
        message: `Voting for this proposal is open`,
        color: `green`
      })
    })

    it(`shows error status`, () => {
      wrapper.vm.proposal.proposal_status = ``
      expect(wrapper.vm.status).toMatchObject({
        message: `There was an error determining the status of this proposal.`,
        color: `grey`
      })
    })
  })

  describe(`Modal onVote`, () => {
    it(`enables voting if the proposal is on the 'VotingPeriod'`, async () => {
      $store = { dispatch: jest.fn() }

      const thisIs = {
        $refs: { modalVote: { open: () => {} } },
        $store,
        votes: {},
        proposalId: `2`,
        lastVote: undefined,
        wallet: { address: `X` }
      }

      await PageProposal.methods.onVote.call(thisIs)

      expect($store.dispatch.mock.calls).toEqual([
        [`getProposalVotes`, thisIs.proposalId]
      ])
      expect(thisIs.lastVote).toBeUndefined()
    })

    it(`load the last valid vote succesfully`, async () => {
      $store = { dispatch: jest.fn() }

      const thisIs = {
        $refs: { modalVote: { open: () => {} } },
        $store,
        votes: { 2: [{
          voter: `X`,
          vote: `yes`
        }] },
        proposalId: `2`,
        lastVote: undefined,
        wallet: { address: `X` }
      }
      expect(thisIs.lastVote).toBeUndefined()

      await PageProposal.methods.onVote.call(thisIs)

      expect($store.dispatch.mock.calls).toEqual([
        [`getProposalVotes`, thisIs.proposalId]
      ])
      expect(thisIs.lastVote).toEqual({ voter: `X`, vote: `yes` })
    })

    it(`disables voting if the proposal is on the 'DepositPeriod'`, () => {
      wrapper.setProps({ proposalId: `5` })
      expect(wrapper.find(`#vote-btn`).exists()).toEqual(false)
    })
  })
})
