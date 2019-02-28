import { shallowMount, createLocalVue } from "@vue/test-utils"
import PageNetwork from "renderer/components/network/PageNetwork"

const localVue = createLocalVue()
localVue.directive(`tooltip`, () => {})

describe(`PageNetwork`, () => {
  let wrapper, $store

  beforeEach(() => {
    $store = {
      getters: {
        connected: true,
        lastHeader: {
          chain_id: `gaia-20k`,
          proposer_address: `EFH47FH723HDHSH`,
          height: `6001`,
          total_txs: `108`,
          time: Date.now()
        },
        delegates: {
          delegates: [
            {
              a: `b`,
              c: `d`
            }
          ]
        },
        pool: {
          pool: {
            bonded_tokens: 125,
            loose_tokens: 10
          }
        },
        bondDenom: `stake`,
        blocks: [
          {
            header: {
              height: `100`,
              num_txs: 1200,
              proposer_address: `ABCDEFG123456HIJKLMNOP`
            }
          },
          {
            header: {
              height: `101`,
              num_txs: 405,
              proposer_address: `ZYXCRS123456HIJKLMNOPQ`
            }
          }
        ]
      }
    }

    wrapper = shallowMount(PageNetwork, {
      localVue,
      mocks: {
        $store
      },
      stubs: [`router-link`]
    })
  })

  it(`has the expected html structure`, () => {
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`sets the status correctly`, () => {
    expect(wrapper.vm.status).toEqual({
      color: `green`,
      message: `Network is up and running`
    })

    $store = {
      getters: {
        connected: false
      }
    }

    wrapper = shallowMount(PageNetwork, {
      localVue,
      mocks: {
        $store
      },
      stubs: [`router-link`]
    })

    expect(wrapper.vm.status).toEqual({
      color: `red`,
      message: `Network is down`
    })
  })

  it(`sets last block to something human readable`, () => {
    expect(wrapper.vm.lastBlock).toEqual(`a few seconds ago`)
  })

  it(`sets properties for the block table`, () => {
    expect(wrapper.vm.properties).toEqual([
      {
        title: `Block Number`,
        value: `block_number`,
        tooltip: `Block Number`,
        class: `blockNumber`
      },
      {
        title: `Transactions`,
        value: `transactions`,
        tooltip: `Number of transactions per block`,
        class: `transactions`
      }
    ])
  })
})
