import { mount } from "@vue/test-utils"
import TmFieldSeed from "common/TmFieldSeed"

describe(`TmFieldSeed`, () => {
  let wrapper

  const propsData = {
    value: `one two three four five six seven eight nine ten eleven twelve`
  }

  beforeEach(() => {
    wrapper = mount(TmFieldSeed, { propsData })
  })

  it(`has a value from props`, () => {
    expect(wrapper.vm.value).toContain(
      `one two three four five six seven eight nine ten eleven twelve`
    )
  })

  it(`has the expected html structure`, () => {
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`has the correct class`, () => {
    expect(wrapper.find(`.tm-field`).classes()).toContain(`tm-field-seed`)
  })
})
