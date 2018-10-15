import setup from "../../../helpers/vuex-setup"
import ShortBech32 from "renderer/components/common/ShortBech32"

describe(`ShortBech32`, () => {
  let wrapper
  let instance = setup()

  beforeEach(() => {
    let test = instance.mount(ShortBech32, {
      propsData: { address: `cosmosftw123456789` }
    })
    wrapper = test.wrapper
  })

  it(`has the expected html structure`, () => {
    expect(wrapper.html()).toMatchSnapshot()
  })

  it(`should return 'address not found'`, () => {
    wrapper.setProps({ address: null })
    wrapper.update()
    expect(wrapper.vm.shortBech32).toBe(`Address Not Found`)
  })

  it(`should return a validation error message`, () => {
    wrapper.setProps({ address: `cosmosaddress2asdfasdfasdf` })
    wrapper.update()
    expect(wrapper.vm.shortBech32).toBe(`Not A Valid Bech32 Address`)
  })

  it(`should return a short address with everything before the 1`, () => {
    wrapper.setProps({ address: `cosmosaddress1asdfasdfasdf` })
    wrapper.update()
    expect(wrapper.vm.shortBech32).toBe(`cosmosaddress…asdf`)
  })

  jest.useFakeTimers()
  it(`clicking copy copies the address`, async () => {
    expect(
      wrapper
        .find(`.copied`)
        .classes()
        .includes(`active`)
    ).toBe(false)

    wrapper.find(`.address`).trigger(`click`)
    expect(
      wrapper
        .find(`.copied`)
        .classes()
        .includes(`active`)
    ).toBe(true)
    jest.runAllTimers()
    expect(
      wrapper
        .find(`.copied`)
        .classes()
        .includes(`active`)
    ).toBe(false)
  })
})
