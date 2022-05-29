const BurnEvent = [
    {
        "anonymous":false,
        "inputs": [
            {
                "indexed":true,
                "internalType":"address",
                "name":"owner",
                "type":"address"
            },
            {
                "indexed":true,
                "internalType":"int24",
                "name":"tickLower",
                "type":"int24"
            },
            {
                "indexed":true,
                "internalType":"int24",
                "name":"tickUpper",
                "type":"int24"
            },
            {
                "indexed":false,
                "internalType":"uint128",
                "name":"amount",
                "type":"uint128"
            },
            {
                "indexed":false,
                "internalType":"uint256",
                "name":"amount0",
                "type":"uint256"
            },
            {
                "indexed":false,
                "internalType":"uint256",
                "name":"amount1",
                "type":"uint256"
            }
        ],
        "name":"Burn",
        "type":"event"
    }
]

module.exports = BurnEvent;