const abiDecoder = require('abi-decoder');

const transfer = require('./transfer');
const approval = require('./approval');
const swap1 = require('./swap1');
const swap2 = require('./swap2');
const burn = require('./burn');
const mint = require('./mint');
const erc721Approval = require('./approval-erc721');
const erc721Transfer_1 = require('./transfer-erc721-1');
const erc721Transfer_2 = require('./transfer-erc721-2');

abiDecoder.addABI(transfer);
abiDecoder.addABI(approval);
abiDecoder.addABI(swap1);
abiDecoder.addABI(swap2);
abiDecoder.addABI(burn);
abiDecoder.addABI(mint);

module.exports = { abiDecoder, erc721Approval, erc721Transfer_1, erc721Transfer_2 };