# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- [\#2152](https://github.com/cosmos/voyager/pull/2152) Feedback button to collect feedback from users on the page @faboweb
- [\#2148](https://github.com/cosmos/voyager/pull/2148) readded insecure mode @faboweb

- Security issue with lodash dependency @faboweb

## [1.0.0-beta.12] - 2019-03-04

## [1.0.0-beta.11] - 2019-03-02

### Changed

- [\#1887](https://github.com/cosmos/voyager/issues/1887) Activating Google Analytics anonymized by default @faboweb
- [\#2098](https://github.com/cosmos/voyager/issues/2098) rename devMode url flag to insecure @faboweb

### Fixed

- [\#2087](https://github.com/cosmos/voyager/issues/2087) More resilient scripts on Ec2 instances, added validators @sabau

## [1.0.0-beta.10] - 2019-03-01

### Added

- [\#135](https://github.com/cosmos/voyager/issues/135) Show fee distribution rewards @fedekunze @faboweb

### Changed 

- [\#2044](https://github.com/cosmos/voyager/issues/2044) convert uatoms to atoms @faboweb
- Refactored tests: LiProposal @jbibla

## [1.0.0-beta.9] - 2019-02-28

### Fixed

- querying delegations was caught in a loop @faboweb
- resetting forms when action modal closes @faboweb

### Changed

- [\#1982](https://github.com/cosmos/voyager/issues/1982) Session screens are proper modals @jbibla

- [\#1337](https://github.com/cosmos/voyager/issues/1337) Refactor tests: PageValidator @faboweb

## [1.0.0-beta.8] - 2019-02-27

### Added

- [\#1032](https://github.com/cosmos/voyager/issues/1032) added several events to google analytics @faboweb
- [\#1630](https://github.com/cosmos/voyager/issues/1630) added memo "Sent via Cosmos UI" to distinguish txs sent via UI @faboweb
- [\#2035](https://github.com/cosmos/voyager/issues/2035) Distribution vuex module @fedekunze
- [\#2088](https://github.com/cosmos/voyager/issues/2088) Faucet button @sabau

### Fixed

- Fixed delegations not loaded on validator lists @faboweb
- [\#2015](https://github.com/cosmos/voyager/issues/2015) fixed error that showed wrong message when Ledger's screensaver mode was on @fedekunze
- Reconnected event was not triggered after reconnection @faboweb
- [\#2094](https://github.com/cosmos/voyager/pull/2094) fix Toolbar @faboweb
- Fix Webpack Env variables @sabau

### Changed

- [\#1337](https://github.com/cosmos/voyager/issues/1337) Refactor tests: TableValidators, TabMyDelegations @jbibla @faboweb
- [\#1337](https://github.com/cosmos/voyager/issues/1337) Refactor tests: pool-module @jbibla
- [\#2023](https://github.com/cosmos/voyager/issues/2023) remove jsdoc @sabau
- [\#1944](https://github.com/cosmos/voyager/issues/1944) Updated `README` @fedekunze

## [1.0.0-beta.7] - 2019-02-26

### Changed

- disabled TmOnboarding by default @jbibla
- [\#1337](https://github.com/cosmos/voyager/issues/1337) Refactor tests: ToolBar, TmModalHelp, LiCoin, PageTransactions, UndelegationModal, TmOnboarding, TmSessionAccountDelete, TabValidators, keybase-module @jbibla @faboweb

## [1.0.0-beta.6] - 2019-02-23

### Added

- Enable dev mode from url param @faboweb

### Fixed

- Refactored tests: PageStaking, PanelSort, TabStakingParameters @faboweb
- Sign in with local key @faboweb
- [\#2024](https://github.com/cosmos/voyager/issues/2024) Fixed feature setting the rpc from url param @faboweb

## [1.0.0-beta.5] - 2019-02-22

### Changed

- Removed Vue error handling to bubble errors to the console, this doesn't effect users @faboweb
- Removed unused packages @sabau
- [\#1337](https://github.com/cosmos/voyager/issues/1337) Removed search bar @jbibla

### Fixed

- Validator page shows now correctly by avoiding async errors @faboweb
- Stylelint configuration and scripts work as expected (no longer in webpack) @jbibla
- page for /governance/:proposalId @sabau

## [1.0.0-beta.4] - 2019-02-21

### Added

- [\#1997](https://github.com/cosmos/voyager/issues/1997) clicking on the top left logo goes to root @faboweb

### Changed

- Refactored user and session modules @faboweb
- Made app header and menu states local @faboweb
- [\#1993](https://github.com/cosmos/voyager/issues/1993) disabled web wallet in production @faboweb
- [\#2031](https://github.com/cosmos/voyager/issues/2031) voyager now depends from cosmos/ledger-cosmos-js

### Fixed

- [\#1999](https://github.com/cosmos/voyager/issues/1999) fixed signing of governance txs due to upstream SDK fix @faboweb
- [\#2028](https://github.com/cosmos/voyager/issues/2028) fixed giant image on onboarding screen @jbibla

## [1.0.0-beta.3] - 2019-02-20

### Added

- [\#1920](https://github.com/cosmos/voyager/issues/1920) Add link to install Cosmos Ledger App @fedekunze
- [\#2000](https://github.com/cosmos/voyager/issues/2000) Add distribution endpoints support @fedekunze

### Changed

- [\#1936](https://github.com/cosmos/voyager/issues/1936) remove `prettier` to avoid overriding `eslint:vue` rules @sabau

### Fixed

- [\#1910](https://github.com/cosmos/voyager/issues/1910) clipboard works in all browsers @jbibla
- [\#1917](https://github.com/cosmos/voyager/issues/1917) Handle ledger disconnection before signing @fedekunze
- [\#1978](https://github.com/cosmos/voyager/issues/1978) Don't display error notifications after timeout on ledger session page @fedekunze
- [\#2016](https://github.com/cosmos/voyager/issues/2016) Display correct error message when rejecting a transaction with ledger @fedekunze

## [1.0.0-beta.2] - 2019-02-19

### Added

### Changed

- [\#1729](https://github.com/cosmos/voyager/issues/1729) Rename endpoint functions @fedekunze
- [\#1790](https://github.com/cosmos/voyager/issues/1790) Rename `lcdClient.js` to `api.js` @fedekunze
- [\#2002](https://github.com/cosmos/voyager/pull/2002) Fix boot process for remote nodes @sabau

### Fixed

- [\#1879](https://github.com/cosmos/voyager/issues/1879) Align tx props with new format from SDK @sabau

## [1.0.0-beta.1] - 2019-02-18

### Fixed

- [\#1958](https://github.com/cosmos/voyager/issues/1958) Kill all processes if one dies to not have dangling processes in development setups @faboweb
- Fix development warning overlaying the UI too much @faboweb

## [0.10003.4] - 2019-02-17

### Added

- Contract tests for `keys` endpoints in lcdClient. @NodeGuy
- Protected Gaia Lite process with a mutex to prevent locking error. @NodeGuy
- catching errors on cache encryption. @faboweb
- [\#1436](https://github.com/cosmos/voyager/issues/1436) governance endpoints and vuex module @fedekunze
- [\#1482](https://github.com/cosmos/voyager/issues/1482) Added ESLint errors: no-var. @sgobotta
- [\#1449](https://github.com/cosmos/voyager/issues/1449) shortNumber to num scripts for more readable numbers. @jbibla
- [\#1509](https://github.com/cosmos/voyager/issues/1509) fail tests on console.error and console.warn and fix related bugs. Plus added a way to simply opt out of failing tests on console usage. @faboweb
- [\#1464](https://github.com/cosmos/voyager/issues/1464) Added governance transactions to tx history page @fedekunze
- [\#1401](https://github.com/cosmos/voyager/issues/1401) Display governance proposals index. @fedekunze
- [\#1472](https://github.com/cosmos/voyager/issues/1472) Added mock functionality for redelegation @fedekunze + @faboweb
- [\#1402](https://github.com/cosmos/voyager/issues/1402) Proposal creation through modal @fedekunze + @NodeGuy + @jbibla
- [\#1501](https://github.com/cosmos/voyager/issues/1501) Vote on proposals through modal @fedekunze + @jbibla
- [\#1567](https://github.com/cosmos/voyager/pull/1567) Various refactors on `main`, `node` and `lcdClient`. @NodeGuy
- [\#1502](https://github.com/cosmos/voyager/issues/1502) A page for each proposal. @jbibla
- [\#1552](https://github.com/cosmos/voyager/issues/1522) Deposit on proposals through modal @fedekunze
- [\#1548](https://github.com/cosmos/voyager/issues/1548) Add mocked deposit for testing @fedekunze
- [\#1116](https://github.com/cosmos/voyager/issues/1116) Elaborate a bit about the release process. @NodeGuy
- [\#1568](https://github.com/cosmos/voyager/issues/1568) Add mocked submit proposal for testing @fedekunze
- [\#1388](https://github.com/cosmos/voyager/issues/1388) Added TmConnectedNetwork to session pages @jbibla
- [\#1564](https://github.com/cosmos/voyager/issues/1564) Add support to query governance proposals on `lcdClient(Mock).js` @fedekunze
- [\#1544](https://github.com/cosmos/voyager/issues/1544) Added eslint-plugin-vue for cleaner vue files @jbibla
- [\#1607](https://github.com/cosmos/voyager/issues/1607) Add tally endpoint to query voting results @fedekunze
- added build option for single os to electron bundle script @faboweb
- [\#1611](https://github.com/cosmos/voyager/issues/1611) added no testnet warning @faboweb
- [\#1573](https://github.com/cosmos/voyager/issues/1573) added remote error collection for several catched errors in Voyager @faboweb
- [\#1632](https://github.com/cosmos/voyager/pull/1632) added FAQ about broken symlink to networks folder @faboweb
- [\#1198](https://github.com/cosmos/voyager/pull/1198) added e2e tests for wallet and staking transactions @faboweb
- [\#1685](https://github.com/cosmos/voyager/pull/1685) added .idea to .gitignore @sabau
- [\#1578](https://github.com/cosmos/voyager/issues/1578) added e2e tests for submit governance proposals @fedekunze
- [\#1672](https://github.com/cosmos/voyager/issues/1672) added e2e tests for staking parameters tab @fedekunze
- [\#1533](https://github.com/cosmos/voyager/issues/1533) added handling of missing connection to the full node at several places. @faboweb
- [\#1648](https://github.com/cosmos/voyager/issues/1648) added governance parameters tab @fedekunze
- [\#1550](https://github.com/cosmos/voyager/issues/1550) added e2e tests for voting on governance proposals @fedekunze
- [\#1555](https://github.com/cosmos/voyager/issues/1555) added e2e tests for submitting a deposit on a governance proposal @fedekunze
- [\#1681](https://github.com/cosmos/voyager/issues/1681) Governance: Fixed voting starting date @sabau
- [\#1690](https://github.com/cosmos/voyager/issues/1690) Governance: Fixed error messages for maxLength @sabau
- [\#1690](https://github.com/cosmos/voyager/issues/1690) Feedbacks when Amount is not between valid thresholds @sabau
- Added compatibility to Gaia/SDK version 0.28.0-rc2 @faboweb
- [\#1673](https://github.com/cosmos/voyager/issues/1673) Documentation and single command to run one or all tests with fallback for end to end test @sabau
- [\#1683](https://github.com/cosmos/voyager/issues/1683) Governance: block voting twice for the same option @sabau
- [\#1774](https://github.com/cosmos/voyager/issues/1776) added specs for the TmFieldSeed update method and value watcher @coreycosman
- [\#1387](https://github.com/cosmos/voyager/issues/1387) Staking: Added list of undelegation transactions @sabau
- [\#1661](https://github.com/cosmos/voyager/issues/1661) Boot: multinode available for local-testnet @sabau
- [\#1748](https://github.com/cosmos/voyager/issues/1748) display governance parameters on tab @fedekunze
- [\#1660](https://github.com/cosmos/voyager/issues/1660) Add parameters and pool to store @fedekunze
- [\#1739](https://github.com/cosmos/voyager/issues/1739) Init jsDoc into project @sabau
- [\#1674](https://github.com/cosmos/voyager/issues/1674) Add PageProfile component with shared styles for validator and proposal profiles @jbibla
- [\#1806](https://github.com/cosmos/voyager/issues/1806) CircleCI security check in dependencies with yarn audit @sabau
- [\#1804](https://github.com/cosmos/voyager/issues/1804) Moved Voyager to the web @faboweb
- [\#1835](https://github.com/cosmos/voyager/issues/1835) allow user to use different signing methods @faboweb
- [\#1833](https://github.com/cosmos/voyager/issues/1833) Prerequisites to allow continuous integration @sabau
- [\#1338](https://github.com/cosmos/voyager/issues/1338) Add Ledger Nano S support for signing transactions @fedekunze
- [\#1869](https://github.com/cosmos/voyager/issues/1869) Added PageNetwork @jbibla
- [\#1894](https://github.com/cosmos/voyager/issues/1894) Added favicons for all the browsers and devices @jbibla
- [\#1865](https://github.com/cosmos/voyager/issues/1865) Added Vuex blocks module @sabau
- [\#1928](https://github.com/cosmos/voyager/issues/1928) Added Browserstack reference to README @sabau
- [\#1918](https://github.com/cosmos/voyager/issues/1918) added message to log in when sending transactions and the user is not authenticated @fedekunze
- [\#1866](https://github.com/cosmos/voyager/issues/1866) Added blocks to network page and a page for viewing individual blocks @jbibla
- [\#1911](https://github.com/cosmos/voyager/issues/1911) Upload code to Sentry for remote error analyzer @faboweb
- Added development mode warning @faboweb
- [\#1972](https://github.com/cosmos/voyager/pull/1972) Add auto PR cron job to circle ci @sabau
- [\#1990](https://github.com/cosmos/voyager/pull/1990) Added postcss plugins and enabled css linter @jbibla

### Changed

- Changed minor component of version number to match testnet version. @NodeGuy
- [\#1433](https://github.com/cosmos/voyager/issues/1433) Migrated to latest SDK commit 6bff7082607a2c36439f8b6218816878c41ca6af. @faboweb
- [\#1183](https://github.com/cosmos/voyager/issues/1183) Changed a bunch of JavaScript files to strict mode. @NodeGuy
- Updated contribution guidelines. @faboweb
- [\#1447](https://github.com/cosmos/voyager/issues/1447) Removed titles from all pages. @faboweb
- Updated PR template @fedekunze
- [\#1454](https://github.com/cosmos/voyager/issues/1454) Updated a bunch of words to (hopefully) be clearer. @jbibla
- [\#1473](https://github.com/cosmos/voyager/issues/1473) added "percent of vote" to validator in vuex module instead of in component @jbibla
- [\#1497](https://github.com/cosmos/voyager/issues/1451) Using an html table for table validators component @jbibla
- [\#1496](https://github.com/cosmos/voyager/issues/1496) display validator pub_key instead of operator_address on livalidator and validator profile @jbibla
- made running a local node easier by reducing it to 2 commands and presetting an account. @faboweb
- [\#1504](https://github.com/cosmos/voyager/issues/1504) updates @tendermint/UI library to 0.4.3 @faboweb
- [\#1410](https://github.com/cosmos/voyager/issues/1410) removed end undelegations as not needed in the SDK anymore
- [\#1543](https://github.com/cosmos/voyager/issues/1543) updated unit tests to use `describe` and `it` instead of `test` @fedekunze
- [\#1377](https://github.com/cosmos/voyager/issues/1377) deleted AppFooter page @fedekunze
- [\#1582](https://github.com/cosmos/voyager/issues/1582) proposals now use time instead of block number @fedekunze
- [\#1585](https://github.com/cosmos/voyager/issues/1585) updated style in coin balances from wallet page @fedekunze
- [\#1547](https://github.com/cosmos/voyager/issues/1547) removed unused media queries @jbibla
- [\#1547](https://github.com/cosmos/voyager/issues/1547) deleted archive directory of old components @jbibla
- removed unit tests from prepush hook @faboweb
- [\#1566](https://github.com/cosmos/voyager/issues/1566) putting querying errors in the store instead of showing notifications @faboweb
- [\#1612](https://github.com/cosmos/voyager/issues/1612) defined props types on components
- changed `err` to `error` because abbreviations are bad @faboweb
- [\#1609](https://github.com/cosmos/voyager/issues/1609) switched to css and html to onboard developers faster @faboweb
- [\#1594](https://github.com/cosmos/voyager/issues/1594) disable decimal amount transfers @fedekunze
- [\#1680](https://github.com/cosmos/voyager/issues/1680) updated `TmBalance` to receive tabs an array of objects to avoid conflicting routes @fedekunze
- [\#1638](https://github.com/cosmos/voyager/issues/1638) removed account password from the state and now user has to input it on every transaction @fedekunze
- [\#1655](https://github.com/cosmos/voyager/issues/1655) Text and Textarea fields trimmed @sabau
- [\#1686](https://github.com/cosmos/voyager/issues/1686) Changed proposals from array to object @sabau
- [\#1387](https://github.com/cosmos/voyager/issues/1387) Delegation: modifiers simplified, setUnbondingDelegations takes an array as input now as the name suggest and replace the current dictionary with a new one @sabau
- [\#1626](https://github.com/cosmos/voyager/issues/1626) upgraded from raven to sentry/browser @jbibla
- [\#1724](https://github.com/cosmos/voyager/issues/1724) set tabindex attribute to -1 for readonly denom on ModalProposals. tab navgiation now skips element @enyan94
- [\#1277](https://github.com/cosmos/voyager/issues/1277) change name of VmToolBar to ToolBar, update all snapshots and import statements @coreycosman
- [\#1432](https://github.com/cosmos/voyager/issues/1432) Moved @tendermint/UI components back into the Voyager repository @faboweb
- [\#1769](https://github.com/cosmos/voyager/issues/1769) Removed hardcoded parameters values @fedekunze
- [\#1694](https://github.com/cosmos/voyager/issues/1694) Improved the `README` @faboweb @fedekunze
- [\#1379](https://github.com/cosmos/voyager/issues/1379) Changed some tests so they don't display errors on the console to better identify real errors @faboweb
- [\#1792](https://github.com/cosmos/voyager/pull/1792) removed mocked demo mode @fedekunze
- [\#1720](https://github.com/cosmos/voyager/issues/1720) Time format from 12 to 24h @sabau
- [\#1802](https://github.com/cosmos/voyager/issues/1802) Enable prefer-const eslint rule @sabau
- [\#1688](https://github.com/cosmos/voyager/issues/1688) Moved from every page to TmPage the connected, loading, empty data and search features @sabau
- [\#1588](https://github.com/cosmos/voyager/issues/1588) 404 page updates @jbibla
- [\#1737](https://github.com/cosmos/voyager/issues/1737) Updates to validator and proposal pages @jbibla
- [\#1846](https://github.com/cosmos/voyager/issues/1846) Allow node endpoints to be set from the URL @faboweb
- [\#1221](https://github.com/cosmos/voyager/issues/1221) individual linter check on GitHub @faboweb
- [\#1855](https://github.com/cosmos/voyager/issues/1855) skip gaia build if already built that hash @sabau
- [\#1922](https://github.com/cosmos/voyager/issues/1922) removed font awesome @jbibla
- [\#1916](https://github.com/cosmos/voyager/pull/1916) redirect to session modal when user hasn't logged in @fedekunze
- [\#1836](https://github.com/cosmos/voyager/issues/1836) remove back button @fedekunze
- [\#1718](https://github.com/cosmos/voyager/issues/1718) Remove session as default @fedekunze
- [\#1948](https://github.com/cosmos/voyager/pull/1948) changed PR template @fedekunze
- [\#1946](https://github.com/cosmos/voyager/pull/1946) removed proposer_address raw hex @jbibla
- [\#1967](https://github.com/cosmos/voyager/pull/1967) bundle analyzer changed from dynamic to static report @sabau
- always upload coverage to prevent PRs not being able to be merged if a not required check doesn't pass @faboweb

### Fixed

- Fixed gaia binary not be found on linux and windows in development @faboweb
- [\#1419](https://github.com/cosmos/voyager/issues/1419) Restored "Amount" label to delegation modal. @NodeGuy
- Fixed upstream cross compilation issue from SDK @faboweb
- [\#1446](https://github.com/cosmos/voyager/issues/1446) and [\#1445](https://github.com/cosmos/voyager/issues/1445) Fixed sorting in validator tables. @NodeGuy
- [\#1487](https://github.com/cosmos/voyager/issues/1487) Fixed running of local testnet. @NodeGuy
- [\#1480](https://github.com/cosmos/voyager/issues/1480) Fixed "duplicate CONN" errors in E2E tests. @NodeGuy
- [\#1480](https://github.com/cosmos/voyager/issues/1480) Fixed false detection of node crash in e2e test start. @faboweb
- [\#1451](https://github.com/cosmos/voyager/issues/1451) Provide better sourcemaps to make debugging easier. @faboweb
- [\#1409](https://github.com/cosmos/voyager/issues/1409) Fixed disabled unbond and redelegation button when delegation amount was less than 1 @fedekunze
- [\#1500](https://github.com/cosmos/voyager/issues/1500) Fixed wrong optimistic updates to the atom balance after staking @faboweb @fedekunze
- [\#1517](https://github.com/cosmos/voyager/issues/1517) Fixed wrong account format used for querying selfBond @faboweb
- [\#1503](https://github.com/cosmos/voyager/issues/1503) Added e2e test for balance updates after delegation @faboweb
- [\#1131](https://github.com/cosmos/voyager/issues/1131) Display only error message on notifications @fedekunze
- [\#1440](https://github.com/cosmos/voyager/issues/1440) Fixed an error that prevented disconnecting from the RPC websocket if it wasn't defined @fedekunze
- [\#1460](https://github.com/cosmos/voyager/issues/1460) Removing release-candidate tag when publishing @faboweb
- [\#1402](https://github.com/cosmos/voyager/issues/1402) Fixed minor issues in voting and deposit @fedekunze
- [\#1574](https://github.com/cosmos/voyager/issues/1574) Fixed typo on mocked governance txs that prevented the execution of the query @fedekunze
- [\#1575](https://github.com/cosmos/voyager/issues/1575) Fixed tags on governance transactions query @fedekunze
- [\#1590](https://github.com/cosmos/voyager/issues/1590) Fixed empty error notifications caused by latest SDK update @fedekunze
- [\#1596](https://github.com/cosmos/voyager/issues/1596) Fixed error that prevented from triggering updates after submitting a new proposal @fedekunze
- [\#1321](https://github.com/cosmos/voyager/issues/1321) Fixed styling on TmModal @jbibla
- [\#1617](https://github.com/cosmos/voyager/pull/1617) Fixed multiple warnings showing on transactions page @faboweb
- [\#1617](https://github.com/cosmos/voyager/pull/1617) Fixed my validators not showing @faboweb
- [\#1617](https://github.com/cosmos/voyager/pull/1617) Fixed send buttons not clickable @faboweb
- [\#1303](https://github.com/cosmos/voyager/issues/1303) Fixed spamming of setSubscription @faboweb
- [\#1603](https://github.com/cosmos/voyager/issues/1603) Fixed inactive sidebar links @jbibla
- [\#1614](https://github.com/cosmos/voyager/issues/1614) Fixed an error that prevented a proposal to be updated optimistically after a successful deposit or vote @fedekunze
- [\#1386](https://github.com/cosmos/voyager/issues/1386) Cleaned up on-boarding @jbibla
- [\#1640](https://github.com/cosmos/voyager/issues/1640) Hide the table proposals when there are no available ones @fedekunze
- [\#1640](https://github.com/cosmos/voyager/issues/1640) Fixed an error that prevented the search bar to be displayed using `Ctrl+F` @fedekunze
- Fixed testnet config build script @faboweb
- [\#1677](https://github.com/cosmos/voyager/issues/1677) Fixed inconsistent status colors on proposals @faboweb
- [\#1687](https://github.com/cosmos/voyager/issues/1687) Removing cached state if decrypting fails. @faboweb
- [\#1662](https://github.com/cosmos/voyager/issues/1662) Fixed wrong node version in readme @faboweb
  [\#1642](https://github.com/cosmos/voyager/issues/1642) Refactor table styles and fixed bad aligned headers @faboweb
- [\#1677](https://github.com/cosmos/voyager/issues/1677) Fixed inconsistent status colors on proposals @fedekunze
- [\#1696](https://github.com/cosmos/voyager/issues/1696) Fixed broken css variables @jbibla
- [\#1687](https://github.com/cosmos/voyager/issues/1687) Removing cached state if decrypting fails. @faboweb
- [\#1662](https://github.com/cosmos/voyager/issues/1662) Fixed wrong node version in readme @faboweb
- [\#1641](https://github.com/cosmos/voyager/issues/1641) Fixed styling of validator page (parameters on top and min-width) @faboweb
- [\#1667](https://github.com/cosmos/voyager/issues/1667) Fixed menu in PageSend + hover cursor for menu @sabau
- [\#1676](https://github.com/cosmos/voyager/issues/1676) Reduced minWidth css for ModalVote to have 2 buttons per line @sabau
- [\#1676](https://github.com/cosmos/voyager/issues/1670) Update balance in header after voting and depositing @faboweb
- [\#1572](https://github.com/cosmos/voyager/issues/1572) Fixed scroll bug when switching between tabs @jbibla
- [\#1749](https://github.com/cosmos/voyager/issues/1749) Fixed proposal tally update after voting @fedekunze
- [\#1765](https://github.com/cosmos/voyager/pull/1765) Fixed proposal deposit update after submitting a deposit @fedekunze
- [\#1791](https://github.com/cosmos/voyager/issue/1791) Fixed a problem with initializing the Voyager config dir @faboweb
- [\#1815](https://github.com/cosmos/voyager/issue/1815) Fixed getters for proposals denominator, reverted to 945803d586b83d65547cd16f4cd5994eac2957ea until interfaces are ready @sabau
- [\#1809](https://github.com/cosmos/voyager/issue/1809) Fixed optimistically updating the header on sending @faboweb
- [\#1791](https://github.com/cosmos/voyager/pull/1791) Fixed a problem with initializing the Voyager config dir @faboweb
- [\#1754](https://github.com/cosmos/voyager/pull/1754) Fixed form UX, UI and other miscellaneous styling issues @jbibla
- [\#1707](https://github.com/cosmos/voyager/issues/1707) Governance txs are now disabled if the user doesn't hold any min_deposit token @fedekunze
- [\#1815](https://github.com/cosmos/voyager/pull/1815) Fixed getters for proposals denominator, reverted to 945803d586b83d65547cd16f4cd5994eac2957ea until interfaces are ready @sabau
- Fixed build process @ƒaboweb
- [\#1818](https://github.com/cosmos/voyager/issues/1818) Fixed error on validator loading showing as no validators @faboweb
- Fixed error locations sucked up by Sentry @faboweb
- [\#1815](https://github.com/cosmos/voyager/pull/1785) Fixed small bug on preferences page @jbibla
- [\#1831](https://github.com/cosmos/voyager/issues/1831) Fixed websocket reconnection @faboweb
- [\#1850](https://github.com/cosmos/voyager/pull/1850) Snapshots aligned for unit tests @sabau
- [\#1859](https://github.com/cosmos/voyager/pull/1859) Fix security check in circleci @sabau
- [\#1892](https://github.com/cosmos/voyager/issues/1892) Fix TmSessionImport form validation @faboweb
- Fixed signing issues related to https://github.com/cosmos/cosmos-sdk/issues/3336 @faboweb
- [\#1896](https://github.com/cosmos/voyager/issues/1896) Correctly update balances if account is empty @faboweb
- Fix actionmodal validation @faboweb
- [\#1934](https://github.com/cosmos/voyager/pull/1934) Fix boot process @sabau
- [\#961](https://github.com/cosmos/voyager/issues/961) Mock timezone and keep moment as it is @sabau
- [\#961](https://github.com/cosmos/voyager/issues/961) Mock only the `now` function from Date module @sabau
- Fixed `yarn start` @ƒaboweb
- [\#1955](https://github.com/cosmos/voyager/issues/1955) Fixed local testnet setup @faboweb
- HOT FIX: unit tests failed due to merge @faboweb
- HOT FIX: we fixed develop (replaced contenthash with hash) @jbibla
- Bring back devMode @faboweb
- [\#1945](https://github.com/cosmos/voyager/issues/1945) Fixed governance parameters quorum description @fedekunze
- [\#1978](https://github.com/cosmos/voyager/pull/1978) Fixed dependency for security audit @sabau
- [\#1977](https://github.com/cosmos/voyager/issues/1977) Fixed ledger notification errors @fedekunze

## [0.10.7] - 2018-10-10

### Added

- Display staking parameters and pool @fedekunze
- TmBalance to transaction history page @jbibla

### Changed

- TmBalance no longer expects unbondedAtoms prop @jbibla
- updated delegates module tests @faboweb
- showing 10 decimal places where bonding denom balance is displayed @jbibla

### Fixed

- set width for validator stats to avoid styling bugs @jbibla
- Test setMockedConnector without starting an endless loop. @NodeGuy
- speed up of e2e tests removing an expected timeout happening on navigate @faboweb
- Use unique keys in validator lists. @NodeGuy

### Changed

- updates to how addresses are displayed and how they can be copied @jbibla

## [0.10.6] - 2018-10-04

### Fixed

- automatic release process bugs @NodeGuy

## [0.10.5] - 2018-10-04

### Changed

- tabs now live inside the balance header @jbibla

### Fixed

- automatic release process bugs @NodeGuy

## [0.10.4] - 2018-10-03

### Fixed

- automatic release process bugs @NodeGuy

## [0.10.3] - 2018-10-02

### Added

- Added staking transactions and fixed 100% height txs. Refactored modules/blockchain.js @okwme
- test if build Voyager actually starts @faboweb
- added new validator component @okwme
- simple loading indicator for page staking @faboweb
- Created new "My Stake" tab. @NodeGuy
- possibility to end unbonding transactions @faboweb
- add option in staking modal to redelegate tokens from previosly bonded validators @fedekunze
- close buttons to Staking modal @NodeGuy
- more tests for new staking modal @NodeGuy
- Add commission and uptime to LiValidator @fedekunze
- Delete old bonding page @fedekunze
- `watch` script for running unit tests @faboweb @NodeGuy
- added unstake modal @faboweb
- `watch` script for running unit tests @faboweb @NodeGuy

### Changed

- Refactored Addressbook. @NodeGuy
- Created new modal window for staking to a validator. @NodeGuy
- Added new validator profile page @faboweb
- cleaning up new validator profile page and balance header @jbibla
- Changed a bunch of JavaScript files to strict mode. @NodeGuy @faboweb
- Refactored submitDelegation. @NodeGuy
- prefer backquotes in code @ƒaboweb
- Refactord submitDelegation. @NodeGuy
- Improved network connectivity bar @jbibla
- refactored words around staking and delegation @jbibla
- the remote lcd and rpc endpoints can now be specified individually in the config.toml and via environment variables @faboweb
- most endpoints use the remote lcd directly to improve performance @faboweb
- Moved Vue error handling code from console_error_throw.js to main.js @NodeGuy

### Fixed

- Do not try to publish a release on every push to `develop`! @NodeGuy
- validator url on txs leading to explorer @faboweb
- fixed a lot of incorrect calculations & bugs on bond page @okwme @faboweb
- removed unnecessary watcher for filling the shopping cart from LiDelegate @faboweb
- delegations request would update state of next user after sign out sign in @ƒaboweb
- enable user to stake only after the request for his current delegations has returned @ƒaboweb
- cache undelegations @faboweb
- show error instead of breaking Voyager if reconnection fails @faboweb
- reconnection errors did not show up correctly in view @faboweb
- fixed crash when reconnecting @faboweb
- fixed crash when using an offline fixed node @faboweb
- layout bugs in PageStaking @NodeGuy
- all seeds offline -> added random new ones @ƒaboweb
- styling around LiValidators @jbibla
- deleted duplicated tx components `TmLiDelegationTransaction.vue` and `TmLiTransaction.vue` @fedekunze
- bugs in the automatic release process @NodeGuy

## [0.10.2] - 2018-08-29

### Changed

- moved about Window to be a native menu so it would display from the application toolbar at any time @faboweb

### Fixed

- use correct set of seed nodes @ƒaboweb
- validator page showed incorrect voting power @faboweb
- improves poor performance at start by throttling the updates of the cached store @faboweb
- Run lint test in CI. @NodeGuy
- current atoms in PageBond still showed old atoms right after staking @ƒaboweb
- fix showing undefined for bonding denom in staking sucess message @faboweb
- fix not showing a lock (I have stake with this one) on a validator if stake is less then 1 @faboweb
- fix showing wrong error on pagebond validation @okwme

## [0.10.1] - 2018-08-29

### Added

- added more information on validators page @faboweb
- added new balance header for wallet @okwme
- E2E environment for a multi validator setup @faboweb
- added dev tools @okwme

### Changed

- cache per network to not have side effects between networks @faboweb
- removed animation from TmLi @okwme
- publish script on CI now requires all tests to pass, so we are sure that the published Version runs @ƒaboweb
- disable interaction buttons if not connected to the network, so user do not expect working interaction @faboweb
- using a variable for determining staking denomination @jbibla
- changed ATOM to bondingDenom getter @okwme
- more bondingDenom and copy updates @jbibla
- restored loading animation on start @faboweb
- improved error message for gaia version imcompatibility in development @faboweb

### Fixed

- solved parsing error with decimals in delegators voting power @fedekunze
- now resetting most store information on signing out to not have side effects between sessions @faboweb
- fixed toggle bg color bug @okwme
- import seed focus bug @okwme
- fixed trying to subscribe to transaction rpc events multiple times (prevent unexpected side effects doing so) @faboweb
- Reduce CHANGELOG.md conflicts. @NodeGuy
- Refactored main process. @NodeGuy
- CircleCI no longer runs test during a push to `release`. @NodeGuy
- E2E tests not producing screenshots and not logging certain values @faboweb
- Wallet balances updating after staking @okwme
- Updated testnet build process @okwme
- Release process now creates Git tag during publish. @NodeGuy
- fixed link to wallet on tx index page @faboweb
- E2E tests now correctly logs everything (before it was only showing the last app start logs) @faboweb

## [0.9.4] - 2018-08-08

### Changed

- remove block explorer and monitor references @jbibla
- removed light theme option from preferences page @jbibla
- enabled staked balance on PageWallet in production @faboweb
- updated tendermint/ui to fix min max override in page send @okwme
- removed unused xmlhttprequest dependency @faboweb
- LCD staking endpoints @fedekunze @faboweb
- the way we show version numbers in the version modal @jbibla

### Added

- storing balance, tx history and delegations locally to serve an old state faster @faboweb
- added error message for missing network config @faboweb
- command for building local node @okwme
- showing staking transactions in history @faboweb

### Fixed

- delegations error message properly parsed @fedekunze
- testnets not properly available after download @faboweb
- Tell the main process when we switch to the mock network. @NodeGuy
- improved tooltip styling @jbibla
- Sort validators by "Your Votes" fixed @okwme
- Overflow bonding bar bug @okwme
- improved modal and wallet styling @jbibla

## [0.9.3] - 2018-08-02

### Fixed

- builds not updating testnet configurations if the gaia version doesn't change @faboweb

## [0.9.2] - 2018-07-30

### Changed

- button styling @jbibla
- Switched to Gaia-7004 @faboweb
- showing warning about out of range of atoms in bonding UI only once on top and renaming it @faboweb
- blocking login if not connected to a node to prevent errors @faboweb

### Fixed

- broken styles in light theme @jbibla
- slider in staking UI @faboweb
- error with empty accounts @faboweb

## [0.9.1] - 2018-07-27

### Added

- Added reload button to transaction history page @faboweb
- added page views for google analytics @faboweb

### Changed

- Showing uniq transactions by their hash in history @faboweb
- Extracted components into @tendermint/ui for use in explorer @okwme
- using new old testnet repo for getting genesis files @faboweb
- switched to Gaia-7003 @faboweb
- Message for empty account @faboweb

### Fixed

- fixed block explorer always showing "syncing" @faboweb
- fixed not pushing to master (caused by me ;P) @faboweb
- Publish script now builds release artifacts. @NodeGuy
- fixed tx subscription @faboweb
- fixed hanging if initial nodes are offline @faboweb
- Copy network configuration from Gaia during publish. @NodeGuy

### Added

- staking e2e tests @faboweb

## [0.8.2] - 2018-07-23

### Fixed

- fixed release process and documentation @faboweb
- Showing weird characters @faboweb

## [0.8.1] - 2018-07-23

### Added

- Indicate if a validator has been revoked in the Staking UI @mappum
- Information about current connection attempts @faboweb
- Release published on GitHub now including changes from CHANGELOG. @NodeGuy
- Added ESLint errors: no-undef and no-unused-vars. @NodeGuy
- Modal when a node doesn't signal any new blocks @faboweb
- Checking the SDK version of the node Voyager connects to against an expected SDK version for the network @faboweb
- Added post checkout yarn @okwme

### Changed

- Copy the network configuration only during local builds. @NodeGuy
- Ignoring the potential local-testnet folder that is used in the README for local testnets @faboweb
- Moved the changelog check to a GitHub status check @faboweb
- Moved to SDK v0.21.1 @faboweb
- Using vue-jest for transpiling in tests for better code coverage output @faboweb
- Default to gaia-7001 @okwme
- Changed `yarn testnet` to `yarn start` @okwme
- Updated colors throughout @jbibla
- Update network @okwme

### Fixed

- Voyager hanging after reloading in development mode @faboweb
- Bad Boy Back Button Back @okwme
- Unable to bond just to already bonded candidates @faboweb
- Staking tokens showing NaN @faboweb
- Staking page showing old shares after bonding @faboweb
- Made linting work on Windows. @NodeGuy
- Renamed some ni- class identifiers to tm- to be consistent @faboweb
- Fixed the theme switcher @faboweb
- Fixed various building bugs. @NodeGuy
- Development CLI tools handle exceptions better. @NodeGuy

## [0.7.1] - 2018-07-04

### Added

- Configs for the gaia-6002 testnet @faboweb
- Bot which returns money to sender in mock mode @mappum
- Introduced addressbook to store found peers and to select nodes round robin @faboweb
- Tutorial how to start a local node @faboweb
- Added versions to Preference Page @okwme
- Send confirmation popup @faboweb
- Checking known nodes round robin and signaling an error if none are available @faboweb
- Help menu with links to report a bug or view the log @faboweb
- build duration and input/output hashes to build process @NodeGuy

### Changed

- Use persistent peers and seeds from tendermint config @faboweb
- Updated loading icon and loading states @jbibla
- more components moved to `@tendermint/ui` @okwme
- Removed COSMOS_MOCKED flag @faboweb
- Improved readability and accessibility @jbibla
- Significant style and UI updates for dark and light themes @jbibla
- Doesn't show loading screen when validators are still stored @okwme
- Improved CI @faboweb
- Search bar fixed to top @okwme
- Hide block subscription errors @mappum
- Fixed css editing in devtools @faboweb
- Added history and disabled backbutton on no history @okwme
- Network configuration files are now taken from the SDK repo. @NodeGuy

### Fixed

- Fixed bug in yarn build:gaia @zramsay
- Increased version of localtestnet used for testing to match gaia @faboweb
- Fixed padding issue in main container @faboweb
- Unit tests work with new components @okwme
- Wait for LCD to start serving at app startup to prevent timing errors @mappum
- Fixed white flash on startup @okwme
- Fixed critical dependency warning @okwme
- Fixed theme bg bug @okwme
- Fixed sorting bug on staking page @okwme
- "About Cosmos Voyager" menu item is now responsive on Windows and Linux @mappum
- Fixed preference page style bug @okwme
- Fixed missing node-ip in connection indicator @faboweb
- Launch sequence for dev improved @okwme
- E2E test maybe fix @okwme
- Login in to restricted page bug @okwme
- Send with an empty wallet bug @okwme
- Readme formatting @okwme

## [0.7.0] - 2018-06-13

### Changes

- Disabled error reporting in development @faboweb
- Removed ci files from code coverage as they are badly testable @faboweb
- Update genesis.json when conflicts are detected @jbibla
- Hide IBC as it will not be ready for launch @faboweb
- Updated e2e tests to not rely on flags to run @okwme
- Not shrinking stacktrace anymore @faboweb
- Improved the visibility and readability of the current network connection. @nylira
- Updated electron to v2.0.2 @okwme
- The release builds now have more sensible names. @NodeGuy
- Transactions use the account number to prevent attacks @faboweb
- Building Voyager now builds Gaia if not found @NodeGuy

### Added

- Bech32 address validation @okwme
- Notification for dev error collection toggle behavior @okwme
- Added automatic releases @faboweb @NodeGuy
- Added staking functionality! @mappum
- Export all testing config on CI @faboweb

### Fixed

- Blocks not updating in block explorer when switching network @faboweb
- Fixed minor typo in README.md @nylira
- Tx bug where state wasn't updated @okwme
- Persisting e2e failure screenshots as artifact on circleci @faboweb
- Theme switching bug @okwme
- Electron dev tool version bug @okwme
- Update delegations also in the wallet view @faboweb
- The release builds forgot to include the network configuration. @NodeGuy
- Skip changelog update check on release branches @faboweb

## [0.6.2] - 2018-05-23

### Added

- Added linting check and unit tests to the git prepush hook @faboweb
- Added basic validation for wallet send @okwme
- Added COSMOS_MOCKED env variable to allow overwriting mocked mode from the command line @faboweb
- User will now be logged out if switching between mocked and live connector @faboweb
- recovery seed form validation & tests @okwme
- added tx view to block explorer @okwme

### Changed

- Simplify pull request and issue templates. @nylira
- Add CONTRIBUTING.md with contributing tips. @nylira
- Build process now builds for all three platforms at the same time. @NodeGuy
- The config.toml is now mocked to guarantee consistent unit tests @faboweb
- The binary is now accepted if it has the same minor version instead of the path version. @faboweb
- Hid staking button on wallet page @jbibla
- Increment version in package.json @jbibla
- Profile page now settings with forked ni-vue-field @okwme @nylira
- Added proper voyager logo to readme @jbibla
- Made search consistent @okwme
- Change gaia-2 to gaia-5001 in readme @jbibla
- Improved readme with better prerequisite instructions @nylira

### Fixes

- Error messages from main thread are now displayed correctly in the view @faboweb

### Fixed

- Re-enabled staking and transactions pages for mocked network. @nylira
- Revealed the password for the default account on the mocked network. @nylira
- Fixed not being able to reconnect to a live network if started in mocked mode. @faboweb

## [0.6.1] - 2018-05-22

### Changed

- Removed some defaults when building a release to reduce confusion. @NodeGuy
- CircleCI no times out after 5 mins to free workers from bad runs. @faboweb
- Fixed a bug where errors that occurred while sending a transaction would prevent further sends from succeeding. @mappum

### Fixed

- Reconnection when coming back from mocked connection works again @faboweb
- Fixed accounts not available after switching back from a mocked connection. @faboweb

## [0.6.0]

### Added

- Added a toggle to switch between a mocked blockchain connector and the live connector @faboweb
- A check for updating the changelog (also pre-push) @faboweb
- Added automatic Prettier formatting on commits @faboweb
- The build process now builds the Cosmos SDK from source code. @NodeGuy

### Changed

- Upgraded many dependencies. @NodeGuy
- Upgraded to new SDK. @mappum
- Improved design of light theme. @nylira
- Improved design on Windows. @nylira
- Disabled the changelog check on develop @faboweb

### Fixed

- Windows build now compresses `zip` file. @NodeGuy
- Fixed block explorer @faboweb
- An error showing after a reconnect @faboweb
- Fixed onboarding window appearing everytime @faboweb

## [0.5.0]

### Added

- The following file types are now formatted with [Prettier](https://prettier.io/): css, js, json, vue.
- Staked tokens are now shown on the wallet page.

### Changed

- If app crashes, a full page error is shown @faboweb
- New Voyager logo @nylira
- The application is now built in a Docker container for increased reproducibility.

## [0.4.4] - 2018-03-08

### Added

- Added `mvp-features.md` to documentation. @nylira
- Added full page error @nylira
- Added receive button and receive modal @jbibla
- The validator hash now has to be approved by the user for security @faboweb
- Transitioned to Docker for easier cross platform builds. @NodeGuy
- New light theme for day time Voyaging 😎 🚀 @nylira
- Users can now opt in or out of remote error collection. @faboweb
- Ability to send over IBC @mappum

### Changed

- The primary staking token is now set in configuration - Fermion during development, Atom for launch.

## [0.4.3] - 2018-02-05

### Changed

- Renamed Cosmos UI to Cosmos Voyager. @nylira
- Added Google Analytics for testnet versions @faboweb
- Added Sentry error reporting for testnet versions @faboweb
- Fixed reconnection issues @faboweb
- Made Windows builds deterministic @mappum
- Reduced size of OSX builds @mappum

## [0.4.2] - 2018-02-05

### Added

- Added back button to every page. @jbibla

### Changed

- Updated transaction history to be more clear and descriptive. @jbibla
- Improved delegate profile page to accommodate candidates and validators. @jbibla

## [0.4.1] - 2018-02-01

### Fixed

- Fix for Windows build crashing on startup. @faboweb

## [0.4.0] - 2018-02-01

### Added

- Added button styles for Success, Warning, and Danger states. @nylira
- Added support for image icons. @faboweb
- Added release documentation. @mappum

### Changed

- Improved primary button style. @nylira
- Fixed the cut-off text bug in buttons. @nylira
- Improves the `hover-bg` app variable color. @nylira
- Updated release script to use `tar-fs` instead of `tar-stream` to support symlinks. @nylira

### Removed

- Removed unused `sass-loader` node dependency. @nylira

## [0.3.1] - 2018-01-30

### Added

- Check to ensure gaia version is correct for the current network @mappum

### Changed

- Added a callback and console output when Vue app has finished loading to test build apps on successful startup. @faboweb
- Resolved notifications error on NiSessionLoading.vue. @nylira
- Resolved old saved prevAccountKey being used in NiSessionSignIn.vue. @nylira
- Improved performance of amountBonded in LiDelegate.vue./ @nylira
- Prevented user from going to PageBond if they don't have any atoms. @nylira
- Hid the bonding interface on PageDelegates if the user doesn't have any atoms. @nylira
- Improved error handling by shutting down the application when there are unhandled errors in the main thread. @faboweb

## [0.3.0] - 2018-01-15

### Added

- Added a changelog @jbibla.
