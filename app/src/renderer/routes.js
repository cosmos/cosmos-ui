function r (type, pageName) { return require(`components/${type}/Page${pageName}`) }

let common = r.bind(null, 'common')
// let govern = r.bind(null, 'govern')
let monitor = r.bind(null, 'monitor')
let staking = r.bind(null, 'staking')
let wallet = r.bind(null, 'wallet')
// let basecoin = r.bind(null, 'basecoin')

export default [
  // GOVERN
  // { path: '/proposals', name: 'proposals', component: govern('Proposals') },
  // { path: '/proposals/new', component: govern('ProposalsNew') },
  // { path: '/proposals/new/adjust', component: govern('ProposalsNewAdjust') },
  // { path: '/proposals/new/amend', component: govern('ProposalsNewAmend') },
  // { path: '/proposals/new/create', component: govern('ProposalsNewCreate') },
  // { path: '/proposals/new/text', component: govern('ProposalsNewText') },
  // { path: '/proposals/new/upgrade', component: govern('ProposalsNewUpgrade') },
  // { path: '/proposals/:proposal', name: 'proposal', component: govern('Proposal') },

  // STAKE
  { path: '/staking', name: 'candidates', component: staking('Candidates') },
  { path: '/staking/delegate', name: 'delegate', component: staking('Delegate') },
  { path: '/staking/nominate', name: 'nominate', component: staking('Nominate') },
  {
    path: '/staking/candidates/:candidate',
    name: 'candidate',
    component: staking('Candidate')
  },

  // MONITOR
  // { path: '/block/:block', name: 'block', component: monitor('Block') },
  // { path: '/blockchain', name: 'blockchain', component: monitor('Blockchain') },
  { path: '/validators', name: 'validators', component: monitor('Validators') },
  {
    path: '/validators/:validator',
    component: monitor('Validator'),
    children: [
      {
        path: '',
        name: 'validator-index',
        component: monitor('ValidatorIndex')
      },
      {
        path: 'delegators',
        name: 'validator-delegators',
        component: monitor('ValidatorDelegators')
      },
      {
        path: 'power',
        name: 'validator-power',
        component: monitor('ValidatorPower')
      },
      {
        path: 'proposals',
        name: 'validator-proposals',
        component: monitor('ValidatorProposals')
      },
      {
        path: 'slashes',
        name: 'validator-slashes',
        component: monitor('ValidatorSlashes')
      },
      {
        path: 'votes',
        name: 'validator-votes',
        component: monitor('ValidatorVotes')
      }
    ]
  },
  // { path: '/delegators', name: 'delegators', component: monitor('Delegators') },
  // { path: '/delegators/:delegator', name: 'delegator', component: monitor('Delegator') },

  // USER
  { path: '/signin', name: 'signin', component: common('SignIn') },
  { path: '/profile', name: 'profile', component: common('Profile') },

  // WALLET
  { path: '/', name: 'balances', component: wallet('Balances') },
  // { path: '/wallet', name: 'balances', component: wallet('Balances') },
  { path: '/wallet/send', name: 'send', component: wallet('Send') },
  { path: '/wallet/receive', name: 'receive', component: wallet('Receive') },

  // 404
  { path: '/404', component: common('404') },
  { path: '*', component: common('404') }
]
