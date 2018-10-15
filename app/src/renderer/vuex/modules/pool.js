"use strict"

export default ({ node }) => {
  const emptyState = {
    pool: {},
    loading: false
  }
  const state = JSON.parse(JSON.stringify(emptyState))

  const mutations = {
    setPool(state, pool) {
      state.pool = pool
    }
  }

  const actions = {
    async getPool({ state, commit }) {
      state.loading = true
      try {
        let pool = await node.getPool()
        commit(`setPool`, pool)
      } catch (err) {
        commit(`notifyError`, {
          title: `Error fetching staking pool`,
          body: err.message
        })
      }
      state.loading = false
    }
  }

  return {
    state,
    mutations,
    actions
  }
}
