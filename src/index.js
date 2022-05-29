const Web3 = require('web3');

const Helper = require('./utils/helper');

async function analyzeTransaction(transactionHash, rpcUrl) {
  const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
  let txType;
  let message;

  const { to, value, from, input, blockNumber } = await web3.eth.getTransaction(transactionHash);
  
  const { timestamp } = await web3.eth.getBlock(blockNumber);

  const isEOA = await Helper.isEOA(to, web3);

  if (isEOA) {
    txType = 'native-asset-transfer';
    message = `${from} sent ${value} to ${to}`;

    const output = { from, value: web3.utils.fromWei(value, 'ether'), txType, to, timeStamp: timestamp };

    return output;
  }

  let txParams;
  let logs;
  
  const functionName = await Helper.extractFunctionName(input);

  const isNFT = await Helper.isNFT(to, rpcUrl);

  if (isNFT) {
    txType = 'contract-call';
    
    logs = await Helper.extractNFTLogs(transactionHash, web3);
    
    if (functionName.includes('Transfer')) {
      const nftTransferDetails = await Helper.extractNFTTransferDetails(input, functionName, to, from, web3);
      
      txParams = nftTransferDetails;
    }

    message = `${from} transferred NFT #${txParams.tokenId} of contract ${to} to ${txParams.recepient}`;
  } else {
    logs = await Helper.extractLogs(transactionHash, web3);

    if (functionName.includes('Transfer')) {
      const tokenTransferDetails = await Helper.extractTokenTransferDetails(input, to, rpcUrl, from, functionName);
  
      txParams = tokenTransferDetails;

      message = `${from} transferred ${txParams.value} ${txParams.tokenSymbol} to ${to}`;
    }

    if (functionName.includes('Swap')) {
      const tokenSwapDetails = await Helper.extractTokenSwapDetails(functionName, input, transactionHash, rpcUrl);

      txParams = tokenSwapDetails;

      message = `${from} swapped ${txParams.srcAmount} ${txParams.srcToken} for ${txParams.destAmount} ${txParams.destToken}`;
    }
  }

  const contractAddress = to;

  const output = (txParams === undefined) ? { from, txType: 'contract-call', logs, functionName, timeStamp: timestamp, contractAddress, message } : { from, txType: 'contract-call', logs, functionName, txParams, timeStamp: timestamp, contractAddress, message };

  return output;
}

module.exports = analyzeTransaction;
