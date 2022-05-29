const TransferABI = [
    {
        "inputs": [
            {
                "internalType":"address",
                "name":"recepient",
                "type":"address"
            },
            {
                "internalType":"uint256",
                "name":"amount",
                "type":"uint256"
            }
        ],
        "name":"transfer",
        "outputs": [
            {
                "internalType":"bool",
                "name":"",
                "type":"bool"
            }
        ],
        "stateMutability":"nonpayable",
        "type":"function"
    }
]

module.exports = TransferABI