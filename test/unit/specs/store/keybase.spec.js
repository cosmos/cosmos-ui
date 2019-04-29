import keybaseModule from "src/vuex/modules/keybase.js"

describe(`Module: Keybase`, () => {
  let state, actions, mutations

  jest.mock(`src/keybase-cache.json`, () => [])

  async function mockKeybaseLookup() {
    return {
      data: {
        status: { name: `OK` },
        them: [
          {
            basics: {
              username: `keybaseUser`
            },
            pictures: {
              primary: {
                url: `pictureUrl`
              }
            }
          }
        ]
      }
    }
  }

  // this is an internal format not the return value from the keybase API
  const mockIdentity = {
    avatarUrl: `pictureUrl`,
    keybaseId: `abcdabcdabcdabcd`,
    lastUpdated: `Thu, 01 Jan 1970 00:00:42 GMT`,
    profileUrl: `https://keybase.io/keybaseUser`,
    userName: `keybaseUser`
  }

  beforeEach(() => {
    const module = keybaseModule({ node: {} })
    state = module.state
    actions = module.actions
    mutations = module.mutations

    state.externals.axios = jest.fn(mockKeybaseLookup)
  })

  describe(`mutations`, () => {
    it(`setKeybaseIdentities`, () => {
      mutations.setKeybaseIdentities(state, [mockIdentity])
      expect(state.identities[`abcdabcdabcdabcd`]).toEqual({
        keybaseId: `abcdabcdabcdabcd`,
        avatarUrl: `pictureUrl`,
        userName: `keybaseUser`,
        profileUrl: `https://keybase.io/keybaseUser`,
        lastUpdated: `Thu, 01 Jan 1970 00:00:42 GMT`
      })
    })
  })

  describe(`actions`, () => {
    it(`should query for the keybase identity`, async () => {
      state.identities = []
      const result = await actions.getKeybaseIdentity(
        { state },
        `abcdabcdabcdabcd`
      )
      expect(state.externals.axios).toHaveBeenCalledWith(
        `https://keybase.io/_/api/1.0/user/lookup.json?key_suffix=abcdabcdabcdabcd&fields=pictures,basics`
      )
      expect(result).toEqual(mockIdentity)
    })

    it(`should query only if identity is unknown or outdated`, async () => {
      state.identities[`abcdabcdabcdabcd`] = mockIdentity
      state.identities[`abcdabcdabcdabcd`].lastUpdated = new Date(
        Date.now()
      ).toUTCString()
      const result = await actions.getKeybaseIdentity(
        { state },
        `abcdabcdabcdabcd`
      )
      expect(state.externals.axios).not.toHaveBeenCalled()
      expect(result).toEqual(mockIdentity)
    })

    it(`should query by name if outdated`, async () => {
      state.identities[`abcdabcdabcdabcd`] = mockIdentity
      state.externals.moment = () => ({ diff: () => -5 })
      const result = await actions.getKeybaseIdentity(
        { state },
        `abcdabcdabcdabcd`
      )
      expect(state.externals.axios).toHaveBeenCalledWith(
        `https://keybase.io/_/api/1.0/user/lookup.json?usernames=keybaseUser&fields=pictures,basics`
      )
      expect(result).toEqual(mockIdentity)
    })

    it(`should requery if wasn't found after 2 minutes`, async () => {
      state.identities[`abcdabcdabcdabcd`] = {}
      state.externals.moment = () => ({ diff: () => -3 })
      const result = await actions.getKeybaseIdentity(
        { state },
        `abcdabcdabcdabcd`
      )
      expect(state.externals.axios).toHaveBeenCalledWith(
        `https://keybase.io/_/api/1.0/user/lookup.json?key_suffix=abcdabcdabcdabcd&fields=pictures,basics`
      )
      expect(result).toEqual(mockIdentity)
    })

    it(`should bulk update the validators`, async () => {
      const dispatch = jest
        .fn()
        .mockReturnValueOnce(mockIdentity)
        .mockReturnValueOnce(null) // mocking a unknown_keybase_identity result
      const commit = jest.fn()

      const validators = [
        { description: { identity: `abcdabcdabcdabcd` } },
        { description: { identity: `unknown_keybase_identity` } }
      ]
      await actions.getKeybaseIdentities(
        { dispatch, commit, state },
        validators
      )
      expect(dispatch).toHaveBeenCalledTimes(2)
      expect(commit).toHaveBeenCalledWith(`setKeybaseIdentities`, [
        mockIdentity
      ])
    })

    it(`should return an empty profile if loading the keybase info fails`, async () => {
      state.externals.axios = () => Promise.reject(`Error`)

      const result = await actions.getKeybaseIdentity(
        { state },
        `abcdabcdabcdabcd`
      )
      expect(result).toEqual({
        keybaseId: `abcdabcdabcdabcd`
      })
    })
  })
})
