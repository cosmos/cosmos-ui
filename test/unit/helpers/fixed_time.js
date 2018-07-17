/* globals jest */
require("moment")
const mockMomentTz = require("moment-timezone")
jest.mock("moment", () => time => mockMomentTz(time).tz("Europe/Berlin"))

const DATE_TO_USE = new Date(1608)
global._Date = Date
global.Date = jest.fn(() => new global._Date(DATE_TO_USE.toISOString()))
Date.now = jest.genMockFunction().mockReturnValue(1608)
