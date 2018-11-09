import setup from "../../../helpers/vuex-setup"
import PageProposal from "renderer/components/governance/PageProposal"
import lcdClientMock from "renderer/connectors/lcdClientMock.js"

let proposal = lcdClientMock.state.proposals[0]
let status = {
  button: null,
  message: `This proposal has passed`,
  color: `green`
}

describe(`PageProposal`, () => {
  let wrapper
  let { mount } = setup()

  beforeEach(() => {
    let instance = mount(PageProposal, {
      propsData: {
        proposal,
        status
      }
    })
    wrapper = instance.wrapper
    wrapper.update()
  })

  it(`has the expected html structure`, async () => {
    // after importing the @tendermint/ui components from modules
    // the perfect scroll plugin needs a $nextTick and a wrapper.update
    // to work properly in the tests (snapshots weren't matching)
    // this has occured across multiple tests
    await wrapper.vm.$nextTick()
    wrapper.update()
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`should return the block number`, () => {
    expect(wrapper.vm.voteBlock).toBe(`block #135`)
  })

  it(`should return the end of the sentence`, () => {
    proposal.submit_block = `135`
    let { wrapper } = mount(PageProposal, {
      propsData: {
        proposal,
        status
      }
    })
    wrapper.update()
    expect(wrapper.vm.voteBlock).toBe(`the same block`)
  })
})
