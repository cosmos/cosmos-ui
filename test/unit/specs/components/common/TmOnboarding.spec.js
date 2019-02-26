import { shallowMount } from "@vue/test-utils"
import TmOnboarding from "common/TmOnboarding.vue"

jest.mock(
  `../../../../../app/src/renderer/assets/images/onboarding/step-0.png`,
  () => jest.fn()
)
jest.mock(
  `../../../../../app/src/renderer/assets/images/onboarding/step-1.png`,
  () => jest.fn()
)
jest.mock(
  `../../../../../app/src/renderer/assets/images/onboarding/step-2.png`,
  () => jest.fn()
)
jest.mock(
  `../../../../../app/src/renderer/assets/images/onboarding/step-3.png`,
  () => jest.fn()
)
jest.mock(
  `../../../../../app/src/renderer/assets/images/onboarding/step-4.png`,
  () => jest.fn()
)

describe(`TmOnboarding`, () => {
  let wrapper, $store

  beforeEach(() => {
    $store = {
      commit: jest.fn(),
      getters: {
        bondDenom: `stake`,
        onboarding: {
          state: 0,
          active: true
        }
      }
    }

    wrapper = shallowMount(TmOnboarding, {
      mocks: {
        $store
      },
    })
  })

  it(`has the expected html structure 0`, () => {
    $store.commit(`setOnboardingState`, `0`)
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`can go to another onboarding node`, () => {
    wrapper.vm.go(3)
    expect($store.commit).toHaveBeenCalledWith(`setOnboardingState`, 3)
  })

  it(`can go to the next node`, () => {
    wrapper.vm.next()
    expect($store.commit).toHaveBeenCalledWith(`setOnboardingState`, 1)
  })
  it(`can restart the onboarding`, () => {
    wrapper.vm.restart()
    expect($store.commit).toHaveBeenCalledWith(`setOnboardingState`, 0)
  })

  it(`can finish the onboarding`, () => {
    wrapper.vm.finish()
    expect($store.commit).toHaveBeenCalledWith(`setOnboardingActive`, false)
    expect($store.commit).toHaveBeenCalledWith(`setOnboardingState`, 0)
  })

  it(`has five onboarding nodes `, () => {
    expect(wrapper.vm.nodes.length).toBe(5)
  })

  it(`has an active node`, () => {
    expect(wrapper.vm.activeKey).toBe(0)
    expect(wrapper.vm.activeValue).toBe(
      `This is a quick tour of the primary features of Cosmos Voyager.`
    )
    expect(wrapper.vm.activeimg).toBeTruthy
  })
})
