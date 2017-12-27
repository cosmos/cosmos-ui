import setup from '../helpers/vuex-setup'
import PageDelegates from 'renderer/components/staking/PageDelegates'

describe('PageDelegates', () => {
  let wrapper, store
  let {mount} = setup()

  beforeEach(() => {
    let instance = mount(PageDelegates)
    wrapper = instance.wrapper
    store = instance.store

    store.state.user.address = 'abc'
    store.commit('addDelegate', {
      pub_key: {
        type: 'ed25519',
        data: 'pubkeyX'
      },
      voting_power: 10000,
      shares: 5000,
      description: {
        description: 'descriptionX',
        keybaseID: 'keybaseX',
        country: 'USA'
      }
    })
    store.commit('addDelegate', {
      pub_key: {
        type: 'ed25519',
        data: 'pubkeyY'
      },
      voting_power: 30000,
      shares: 10000,
      description: {
        description: 'descriptionY',
        keybaseID: 'keybaseY',
        country: 'Canada'
      }
    })
    wrapper.update()
  })

  it('has the expected html structure', () => {
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it('should show the search on click', () => {
    wrapper.find('.ni-tool-bar i').trigger('click')
    expect(wrapper.contains('.ni-modal-search')).toBe(true)
  })

  it('should refresh candidates on click', () => {
    wrapper.findAll('.ni-tool-bar i').at(1).trigger('click')
    expect(store.dispatch).toHaveBeenCalledWith('getDelegates')
  })

  it('should sort the delegates by selected property', () => {
    expect(wrapper.vm.filteredDelegates.map(x => x.id)).toEqual(['pubkeyX', 'pubkeyY'])

    wrapper.vm.sort.property = 'voting_power'
    wrapper.vm.sort.order = 'desc'
    expect(wrapper.vm.filteredDelegates.map(x => x.id)).toEqual(['pubkeyY', 'pubkeyX'])
  })

  it('should filter the delegates', () => {
    store.commit('setSearchVisible', ['delegates', true])
    store.commit('setSearchQuery', ['delegates', 'baseX'])
    expect(wrapper.vm.filteredDelegates.map(x => x.id)).toEqual(['pubkeyX'])
    expect(wrapper.vm.$el).toMatchSnapshot()
    store.commit('setSearchQuery', ['delegates', 'baseY'])
    expect(wrapper.vm.filteredDelegates.map(x => x.id)).toEqual(['pubkeyY'])
  })

  it('should show the amount of selected delegates', () => {
    store.commit('addToCart', store.state.delegates[0])
    store.commit('addToCart', store.state.delegates[1])
    wrapper.update()
    expect(wrapper.html()).toContain('2 Selected')
  })

  it('should show an error if there are no delegates', () => {
    let {wrapper} = mount(PageDelegates, {
      getters: {
        delegates: () => []
      },
      stubs: {
        'data-error': '<data-error />'
      }
    })

    expect(wrapper.contains('data-error')).toBe(true)
  })
})
