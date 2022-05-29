const TransferEvent = [
    {
        "anonymous":false,
        "inputs": [
            {
                "indexed":false,
                "internalType":"address",
                "name":"_from",
                "type":"address"
            },
            {
                "indexed":false,
                "internalType":"address",
                "name":"_to",
                "type":"address"
            },
            {
                "indexed":false,
                "internalType":"uint256",
                "name":"_tokenId",
                "type":"uint256"
            }
        ],
        "name":"Transfer",
        "type":"event"
    }
]

module.exports = TransferEvent;