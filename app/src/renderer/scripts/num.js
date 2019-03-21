"use strict"
import BigNumber from "bignumber.js"

/**
 * Defines all numerical methods
 * @module num
 */

const SMALLEST = 1e-6
const language = window.navigator.userLanguage || window.navigator.language
function full(number = 0) {
  return new Intl.NumberFormat(language, { minimumFractionDigits: 6 })
    .format(number)
}
function shortNumber(number = 0) {
  return new Intl.NumberFormat(language, { minimumFractionDigits: 4 }).format(number) + `…`
}
function pretty(number = 0) {
  return new Intl.NumberFormat(
    language,
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  ).format(Math.round(number * 100) / 100)
}
// pretty print long decimals not in scientific notation
function prettyDecimals(number = 0) {
  let longDecimals = new Intl.NumberFormat(
    language,
    { minimumFractionDigits: 20, maximumFractionDigits: 20 }
  ).format(number)

  // remove all trailing zeros
  while (longDecimals.charAt(longDecimals.length - 1) === `0`) {
    longDecimals = longDecimals.substr(0, longDecimals.length - 1)
  }

  // remove decimal separator from whole numbers
  if (Number.isNaN(Number(longDecimals.charAt(longDecimals.length - 1)))) {
    longDecimals = longDecimals.substr(0, longDecimals.length - 1)
  }

  return longDecimals
}
function prettyInt(number = 0) {
  return new Intl.NumberFormat(language).format(Math.round(number))
}
function percentInt(number = 0) {
  return new Intl.NumberFormat(language).format(Math.round(number * 100)) + `%`
}
function percent(number = 0) {
  return new Intl.NumberFormat(
    language,
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  ).format(Math.round(number * 10000) / 100) + `%`
}
function atoms(number = 0) {
  return BigNumber(number).div(1e6).toNumber()
}
function uatoms(number = 0) {
  return BigNumber(number).times(1e6).toString()
}

// convert micro denoms like uatom to display denoms like atom
function viewDenom(denom) {
  if (denom.charAt(0) === `u`) {
    return denom.substr(1)
  }
  return denom
}

function viewCoin({ amount, denom }) {
  return {
    amount: full(atoms(amount)),
    denom: viewDenom(denom)
  }
}

module.exports = {
  SMALLEST,
  atoms,
  uatoms,
  viewDenom,
  viewCoin,
  full,
  shortNumber,
  pretty,
  prettyInt,
  percent,
  percentInt,
  prettyDecimals
}
