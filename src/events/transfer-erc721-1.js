const TransferEvent = [
    {
        "anonymous":false,
        "inputs": [
            {
                "indexed":false,
                "internalType":"address",
                "name":"from",
                "type":"address"
            },
            {
                "indexed":false,
                "internalType":"address",
                "name":"to",
                "type":"address"
            },
            {
                "indexed":false,
                "internalType":"uint256",
                "name":"tokenId",
                "type":"uint256"
            }
        ],
        "name":"Transfer",
        "type":"event"
    }
]

module.exports = TransferEvent;