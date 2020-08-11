import getFirebase from "../../firebase.js"
import * as Sentry from "@sentry/browser"
import gql from "graphql-tag"
import { Plugins } from "@capacitor/core"
import config from "src/../config"
const { App: CapacitorApp } = Plugins

export default ({ apollo }) => {
  const state = {
    userSignedIn: false,
    user: null,
    signInEmailError: null,
    signInError: null,
  }

  const mutations = {
    userSignedIn(state, hasSignedIn) {
      state.userSignedIn = hasSignedIn
    },
    setSession(state, session) {
      state.session = session
    },
    setUserInformation(state, user) {
      state.user = user
    },
    setSignInError(state, error) {
      state.signInError = error
    },
    setSignInEmailError(state, error) {
      state.signInEmailError = error
    },
  }

  const actions = {
    async listenToAuthChanges({ dispatch, commit }) {
      const Auth = (await getFirebase()).auth()
      await new Promise((resolve) =>
        Auth.onAuthStateChanged(async (user) => {
          if (user) {
            // we only sign the user in, if we get a session from the API
            // commit(`userSignedIn`, true)
            commit(`setUserInformation`, user)

            // make sure new authorization token get added to header
            apollo.cache.reset()
          } else {
            // user signed out
            dispatch(`storeSession`, null)
            commit(`setUserInformation`, null)
          }
          resolve()
        })
      )
    },
    async signInUser({ commit, dispatch }, url) {
      commit(`setSignInError`, undefined)
      const Auth = (await getFirebase()).auth()
      try {
        if (Auth.isSignInWithEmailLink(url)) {
          const user = JSON.parse(localStorage.getItem(`user`))
          if (!user)
            throw new Error("Sign in flow broken. User E-Mail is unknown.")
          await Auth.signInWithEmailLink(user.email, url)

          const idToken = await Auth.currentUser.getIdToken(
            /* forceRefresh */ true
          )
          apollo.mutate({
            mutation: gql`
              mutation {
                registerUser(idToken:"${idToken}") {
                  sessionToken
                  validUntil
                }
              }
            `,
            update(cache, { data }) {
              const session = data.registerUser
              dispatch("storeSession", session)
            },
          })
        }
      } catch (error) {
        console.error(error)
        Sentry.captureException(error)
        commit(`setSignInError`, error)
      }
    },
    storeSession({ commit }, session) {
      if (session) {
        localStorage.setItem("session", JSON.stringify(session))
      } else {
        localStorage.removeItem("session")
      }
      commit("setSession", session)
      commit("userSignedIn", !!session)
    },
    checkSession({ dispatch }) {
      const session = localStorage.getItem("session")
        ? JSON.parse(localStorage.getItem("session"))
        : undefined
      dispatch("storeSession", session)
    },
    async sendUserMagicLink({ commit }, { user }) {
      commit(`setSignInEmailError`, undefined)
      const Auth = (await getFirebase()).auth()
      const actionCodeSettings = {
        url: config.mobileApp
          ? `https://app.lunie.io/email-authentication`
          : `${window.location.protocol}//${window.location.host}/email-authentication`,
        handleCodeInApp: true,
        android: {
          packageName: `org.lunie.lunie`,
          installApp: true,
          minimumVersion: `1.0.221`, // the first version with deep linking enabled
        },
        iOS: {
          bundleId: `org.lunie.lunie`,
        },
      }
      try {
        await Auth.sendSignInLinkToEmail(user.email, actionCodeSettings)
        localStorage.setItem("user", JSON.stringify(user))
      } catch (error) {
        commit(`setSignInEmailError`, error)
        Sentry.captureException(error)
      }
    },
    async signOutUser({ commit }) {
      const Auth = (await getFirebase()).auth()
      try {
        await Auth.signOut()
        localStorage.removeItem(`session`)
        // get rid of cached token in header
        apollo.cache.reset()
      } catch (error) {
        commit(`setSignInError`, error)
        Sentry.captureException(error)
      }
    },
  }

  return {
    state,
    mutations,
    actions,
  }
}

// Deep Linking: The app can receive a deep link. This link needs to be forwarded to the web app. https://capacitorjs.com/docs/guides/deep-links
export async function getLaunchUrl(router) {
  const urlOpen = await CapacitorApp.getLaunchUrl()
  if (!urlOpen || !urlOpen.url) return
  handleDeeplink(urlOpen.url, router)
}

export function handleDeeplink(url, router) {
  console.log("Received deeplink " + url)

  // Example url: https://lunie.io/email-authentication
  // slug = /email-authentication
  const regexp = /(https?:\/\/)?[\w\d-\.]+\/([\w\d-\/]*)(\?(.+))?/
  const matches = regexp.exec(url)
  const path = matches[1]
  const query = matches[3]

  const queryObject = query ? query
    .split("&")
    .map((keyValue) => keyValue.split("="))
    .reduce((query, [key, value]) => {
      query[key] = value
      return query
    }, {}) : {}

  // if we receive a deeplink for firebase authentication we follow that link
  // the target will perform the authentication and then redirect back to lunie
  if (queryObject.link || queryObject.ifl) {
    const link = unescape(queryObject.link || queryObject.ifl)
    if (config.mobileApp) {
      window.open(link, "_blank")
    } else {
      window.location = link
    }
    return
  }

  try {
    // change the route to the route we got from the deeplink
    router.push({
      path: "/" + path,
      query: queryObject,
    })
  } catch (error) {
    console.error(error)
  }
}
