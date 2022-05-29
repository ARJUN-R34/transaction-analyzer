const Web3 = require('web3');

const events = require('../events');
const sigs = require('../function-signatures');
const ABIs = require('../function-abis');
const oldNFTContracts = require('../utils/old-nft-contracts');

async function isEOA(address, web3) {
  const isEOA = await web3.eth.getCode(address);
  
  if(isEOA === '0x') {
      return true;
  }

  return false;
}

async function extractLogs(transactionHash, web3) {
  let eventParams = [];

  const { logs } = await web3.eth.getTransactionReceipt(transactionHash);

  const decodedLogs = events.abiDecoder.decodeLogs(logs);

  decodedLogs.forEach((txs) => {
    let parameters = []
    eventParams.push({ name: txs.name, parameters });
    txs.events.forEach((parameter) => {
      eventParams[eventParams.length - 1].parameters.push({ name: parameter.name, value: parameter.value, type: parameter.type });
    });
  })

  return eventParams;
}

async function extractNFTLogs(transactionHash, web3) {
  await addABI([ABIs.erc721ABI]);

  let eventParams = [];

  const { logs, to } = await web3.eth.getTransactionReceipt(transactionHash);

  if (oldNFTContracts[web3.utils.toChecksumAddress(to)] !== undefined) {
    await addABI([ABIs[oldNFTContracts[web3.utils.toChecksumAddress(to)]]]);
  }

  const decodedLogs = events.abiDecoder.decodeLogs(logs);

  decodedLogs.forEach((txs) => {
    let parameters = []
    eventParams.push({ name: txs.name, parameters });
    txs.events.forEach((parameter) => {
      eventParams[eventParams.length - 1].parameters.push({ name: parameter.name, value: parameter.value, type: parameter.type });
    });
  })

  return eventParams;
}

async function extractFunctionName(input) {
  let functionName;

  const signature = input.substring(0, 10);

  if (sigs[signature] === undefined) {
      functionName = signature;
  } else {
      functionName = sigs[signature];
  }

  return functionName;
}

async function extractTokenTransferDetails(input, to, rpcUrl, from, functionName) {
  const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

  const erc20Instance = new web3.eth.Contract(ABIs.erc20ABI, to);
  
  await addABI([ABIs.erc20ABI]);

  const decodedData = events.abiDecoder.decodeMethod(input);

  const symbol = await erc20Instance.methods.symbol().call();

  const decimal = await erc20Instance.methods.decimals().call();

  let output;

  switch (functionName) {

    case 'Transfer':
      output = {
        from,
        tokenSymbol: symbol,
        recepient: decodedData.params[0].value,
        value: decodedData.params[1].value/10**parseInt(decimal),
      }

      break;

    case 'Transfer From':
      output = {
        operator: from,
        from: decodedData.params[0].value,
        tokenSymbol: symbol,
        recepient: decodedData.params[1].value,
        value: decodedData.params[2].value/10**parseInt(decimal),
      }

      break;

  }

  return output;
}

async function extractTokenSwapDetails(functionName, input, transactionHash, rpcUrl) {
  const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

  await addABI([ABIs.swapABI1, ABIs.swapABI2, ABIs.swapABI3, ABIs.swapABI4, ABIs.swapABI5, ABIs.swapABI6]);

  const decodedData = events.abiDecoder.decodeMethod(input);

  const logs = await this.extractLogs(transactionHash, web3);

  const transferLogs = logs.filter(log => log.name === 'Transfer');

  let output;
  let srcTokenInstance;
  let dstTokenInstance;
  let srcSymbol;
  let srcDecimal;
  let dstSymbol;
  let dstDecimal;

  switch (functionName) {

    case 'Swap Exact ETH For Tokens':

      srcTokenInstance = new web3.eth.Contract(ABIs.erc20ABI, decodedData.params[1].value[0]);
      dstTokenInstance = new web3.eth.Contract(ABIs.erc20ABI, decodedData.params[1].value[decodedData.params[1].value.length - 1]);

      srcSymbol = await srcTokenInstance.methods.symbol().call();

      dstSymbol = await dstTokenInstance.methods.symbol().call();
      dstDecimal = await dstTokenInstance.methods.decimals().call();
    
      output = {
        srcToken: (srcSymbol === 'WETH') ? 'ETH' : srcSymbol,
        srcTokenContractAddress: (srcSymbol === 'WETH') ? undefined : decodedData.params[1].value[0],
        srcAmount: web3.utils.fromWei(transferLogs[0].parameters[2].value, 'ether'),
        destToken: dstSymbol,
        destAmount: transferLogs[transferLogs.length - 1].parameters[2].value/10**parseInt(dstDecimal),
        destTokenContractAddress: (dstSymbol === 'WETH') ? undefined : decodedData.params[1].value[decodedData.params[1].value.length - 1],
      }

      break;

    case 'Swap Exact Tokens For ETH':
      srcTokenInstance = new web3.eth.Contract(ABIs.erc20ABI, decodedData.params[2].value[0]);
      dstTokenInstance = new web3.eth.Contract(ABIs.erc20ABI, decodedData.params[2].value[decodedData.params[2].value.length - 1]);

      srcSymbol = await srcTokenInstance.methods.symbol().call();
      srcDecimal = await srcTokenInstance.methods.decimals().call();

      dstSymbol = await dstTokenInstance.methods.symbol().call();
    
      output = {
        srcTokenContractAddress: (srcSymbol === 'WETH') ? undefined : decodedData.params[2].value[0],
        srcToken: srcSymbol,
        srcAmount: decodedData.params[0].value/10**parseInt(srcDecimal),
        destToken: (dstSymbol === 'WETH') ? 'ETH' : dstSymbol,
        destTokenContractAddress: (dstSymbol === 'WETH') ? undefined : decodedData.params[2].value[decodedData.params[2].value.length - 1],
        destAmount: parseFloat(web3.utils.fromWei(transferLogs[transferLogs.length - 1].parameters[2].value, 'ether')),
      }

      break;

      case 'Swap Exact Tokens For Tokens':
        srcTokenInstance = new web3.eth.Contract(ABIs.erc20ABI, decodedData.params[2].value[0]);
        dstTokenInstance = new web3.eth.Contract(ABIs.erc20ABI, decodedData.params[2].value[decodedData.params[2].value.length - 1]);

        srcSymbol = await srcTokenInstance.methods.symbol().call();
        srcDecimal = await srcTokenInstance.methods.decimals().call();

        dstSymbol = await dstTokenInstance.methods.symbol().call();
        dstDecimal = await dstTokenInstance.methods.decimals().call();

        output = {
          srcToken: (srcSymbol === 'WETH') ? 'ETH' : srcSymbol,
          srcTokenContractAddress: (srcSymbol === 'WETH') ? undefined : decodedData.params[2].value[0],
          srcAmount: transferLogs[0].parameters[2].value/10**parseInt(srcDecimal),
          destToken: (dstSymbol === 'WETH') ? 'ETH' : dstSymbol,
          destAmount: transferLogs[transferLogs.length - 1].parameters[2].value/10**parseInt(dstDecimal),
          destTokenContractAddress: (dstSymbol === 'WETH') ? undefined : decodedData.params[2].value[decodedData.params[2].value.length - 1],
        }

        break;
      
      case 'Swap Tokens For Exact Tokens':
        srcTokenInstance = new web3.eth.Contract(ABIs.erc20ABI, decodedData.params[2].value[0]);
        dstTokenInstance = new web3.eth.Contract(ABIs.erc20ABI, decodedData.params[2].value[decodedData.params[2].value.length - 1]);

        srcSymbol = await srcTokenInstance.methods.symbol().call();
        srcDecimal = await srcTokenInstance.methods.decimals().call();

        dstSymbol = await dstTokenInstance.methods.symbol().call();
        dstDecimal = await dstTokenInstance.methods.decimals().call();

        output = {
          srcToken: (srcSymbol === 'WETH') ? 'ETH' : srcSymbol,
          srcTokenContractAddress: (srcSymbol === 'WETH') ? undefined : decodedData.params[2].value[0],
          srcAmount: transferLogs[0].parameters[2].value/10**parseInt(srcDecimal),
          destToken: (dstSymbol === 'WETH') ? 'ETH' : dstSymbol,
          destAmount: transferLogs[transferLogs.length - 1].parameters[2].value/10**parseInt(dstDecimal),
          destTokenContractAddress: (dstSymbol === 'WETH') ? undefined : decodedData.params[2].value[decodedData.params[2].value.length - 1],
        }

        break;

      case 'Swap ETH For Exact Tokens':
        srcTokenInstance = new web3.eth.Contract(ABIs.erc20ABI, decodedData.params[1].value[0]);
        dstTokenInstance = new web3.eth.Contract(ABIs.erc20ABI, decodedData.params[1].value[decodedData.params[1].value.length - 1]);

        srcSymbol = await srcTokenInstance.methods.symbol().call();
        srcDecimal = await srcTokenInstance.methods.decimals().call();

        dstSymbol = await dstTokenInstance.methods.symbol().call();
        dstDecimal = await dstTokenInstance.methods.decimals().call();

        output = {
          srcToken: (srcSymbol === 'WETH') ? 'ETH' : srcSymbol,
          srcTokenContractAddress: (srcSymbol === 'WETH') ? undefined : decodedData.params[2].value[0],
          srcAmount: transferLogs[0].parameters[2].value/10**parseInt(srcDecimal),
          destToken: (dstSymbol === 'WETH') ? 'ETH' : dstSymbol,
          destAmount: transferLogs[transferLogs.length - 1].parameters[2].value/10**parseInt(dstDecimal),
          destTokenContractAddress: (dstSymbol === 'WETH') ? undefined : decodedData.params[1].value[decodedData.params[1].value.length - 1],
        }

        break;

      case 'Swap Tokens For Exact ETH':
        srcTokenInstance = new web3.eth.Contract(ABIs.erc20ABI, decodedData.params[2].value[0]);
        dstTokenInstance = new web3.eth.Contract(ABIs.erc20ABI, decodedData.params[2].value[decodedData.params[2].value.length - 1]);

        srcSymbol = await srcTokenInstance.methods.symbol().call();
        srcDecimal = await srcTokenInstance.methods.decimals().call();

        dstSymbol = await dstTokenInstance.methods.symbol().call();
        dstDecimal = await dstTokenInstance.methods.decimals().call();

        output = {
          srcToken: (srcSymbol === 'WETH') ? 'ETH' : srcSymbol,
          srcTokenContractAddress: (srcSymbol === 'WETH') ? undefined : decodedData.params[2].value[0],
          srcAmount: transferLogs[0].parameters[2].value/10**parseInt(srcDecimal),
          destToken: (dstSymbol === 'WETH') ? 'ETH' : dstSymbol,
          destAmount: transferLogs[transferLogs.length - 1].parameters[2].value/10**parseInt(dstDecimal),
          destTokenContractAddress: (dstSymbol === 'WETH') ? undefined : decodedData.params[2].value[decodedData.params[2].value.length - 1],
        }

        break;
  }

  return output;
}

async function extractNFTTransferDetails(input, functionName, contractAddress, from, web3) {
  await addABI([ABIs.erc721ABI]);

  const decodedData = events.abiDecoder.decodeMethod(input);

  let output;

  if (oldNFTContracts[web3.utils.toChecksumAddress(contractAddress)] !== undefined) {
    output = await getOldNFTContractOutput(decodedData, functionName, from);
  } else {
    switch (functionName) {
  
      case 'Transfer':
        output = {
          from,
          recepient: decodedData.params[1].value,
          tokenId: decodedData.params[2].value,
        }
  
        break;
      
      case 'Transfer From':
        output = {
          from: decodedData.params[0].value,
          recepient: decodedData.params[1].value,
          tokenId: decodedData.params[2].value,
        }
  
        break;
  
      case 'Safe Transfer From':
        output = {
          from: decodedData.params[0].value,
          recepient: decodedData.params[1].value,
          tokenId: decodedData.params[2].value,
        }
  
        break;

    }
  }

  return output;
}

async function getOldNFTContractOutput(decodedData, functionName, from) {
  let output;

  switch(functionName) {

    case 'Transfer Punk':
      output = {
        from,
        recepient: decodedData.params[0].value,
        tokenId: decodedData.params[1].value,
      }

      break;

    case 'Transfer':
      output = {
        from,
        recepient: decodedData.params[0].value,
        tokenId: decodedData.params[1].value,
      }

      break;

  }

  return output;
}

async function isNFT(contractAddress, rpcUrl) {
  const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

  const erc20Instance = new web3.eth.Contract(ABIs.erc20ABI, contractAddress);
  const erc721Instance = new web3.eth.Contract(ABIs.erc721ABI, contractAddress);

  let isERC20;
  let isERC721;
  let status;

  try {
    await erc20Instance.methods.decimals().call();

    isERC20 = true;
  } catch (error) {
    isERC20 = false;
  }

  try {
    await erc721Instance.methods.isApprovedForAll('0x617F2E2fD72FD9D5503197092aC168c91465E7f2', '0x1aE0EA34a72D944a8C7603FfB3eC30a6669E454C').call();

    isERC721 = true
  } catch (error) {
    isERC721 = false;
  }

  isERC721 = (isERC721 === false && oldNFTContracts[web3.utils.toChecksumAddress(contractAddress)] !== undefined) ? true : isERC721;

  if (!isERC721 && !isERC20) {
    status = false;
  } else {
    status = isERC721;
  }

  return status;
}

async function addABI(abiArray) {
  abiArray.forEach(abi => {
    events.abiDecoder.addABI(abi);
  });

  return true;
}

module.exports = {
  isEOA,
  extractLogs,
  extractFunctionName,
  extractTokenTransferDetails,
  extractTokenSwapDetails,
  extractNFTTransferDetails,
  isNFT,
  extractNFTLogs,
};