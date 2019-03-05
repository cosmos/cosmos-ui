import { shallowMount, createLocalVue } from "@vue/test-utils"
import PageBlock from "renderer/components/network/PageBlock"

const localVue = createLocalVue()
localVue.directive(`tooltip`, () => {})

describe(`PageBlock`, () => {
  let wrapper

  const getters = {
    connected: true,
    block: {
      block_meta: {
        block_id: {
          hash: `ABCD1234`
        }
      },
      block: {
        data: {
          txs: `txs`
        },
        header: {
          height: `100`,
          num_txs: 1200,
          proposer_address: `ABCDEFG123456HIJKLMNOP`,
          time: Date.now()
        },
        evidence: {
          evidence: `evidence`
        },
        last_commit: {
          precommits: [
            {
              validator_address: `validator address`,
              timestamp: Date.now(),
              round: 0
            }
          ]
        }
      }
    },
    lastHeader: {
      height: `1000`
    }
  }

  beforeEach(() => {
    wrapper = shallowMount(PageBlock, {
      localVue,
      mocks: {
        $store: {
          getters,
          dispatch: jest.fn()
        },
        $route: {
          params: { height: `100` }
        },
        $router: {
          push: jest.fn()
        }
      },
      stubs: [`router-link`]
    })
  })

  it(`shows a page with information about a certain block`, () => {
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`sets properties for the block table`, () => {
    expect(wrapper.vm.properties).toEqual([
      {
        title: `Proposer`
      },
      {
        title: `Time`
      },
      {
        title: `Round`
      }
    ])
  })

  it(`loads the block information when the route changes`, () => {
    const getBlock = jest.fn()
    PageBlock.watch[`$route.params.height`].call({ getBlock })

    expect(getBlock).toHaveBeenCalled()
  })

  it(`shows the page when the block hasn't been loaded yet`, () => {
    wrapper = shallowMount(PageBlock, {
      localVue,
      mocks: {
        $store: {
          getters: Object.assign({}, getters, {
            block: {}
          }),
          dispatch: jest.fn()
        },
        $route: {
          params: { height: `100` }
        },
        $router: {
          push: jest.fn()
        }
      },
      stubs: [`router-link`]
    })

    expect(wrapper.vm.$el).not.toBeUndefined()
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`redirects to the 404 page if the block doesn't exist`, async () => {
    const routerPush = jest.fn()

    await PageBlock.methods.getBlock({
      $store: {
        dispatch: () => null, // not returning a block when querying
      },
      $route: {
        params: {
          height: `42`
        }
      },
      $router: {
        push: routerPush
      },
      lastHeader: {
        height: `1`
      }
    })

    expect(routerPush).toHaveBeenCalledWith(`/404`)

    routerPush.mockClear()
    await PageBlock.methods.getBlock({
      $store: {
        dispatch: () => ({ x: 1 }) // return pseudo block
      },
      $route: {
        params: {
          height: 42
        }
      },
      $router: {
        push: routerPush
      },
      lastHeader: {
        height: `1000`
      }
    })

    expect(routerPush).not.toHaveBeenCalledWith(`/404`)
  })
})
