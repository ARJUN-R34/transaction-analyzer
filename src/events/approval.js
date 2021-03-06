const ApprovalEvent = [
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
                "internalType":"address",
                "name":"spender",
                "type":"address"
            },
            {
                "indexed":false,
                "internalType":"uint256",
                "name":"value",
                "type":"uint256"
            }
        ],
        "name":"Approval",
        "type":"event"
    }
]

module.exports = ApprovalEvent;