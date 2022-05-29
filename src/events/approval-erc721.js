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
                "name":"approved",
                "type":"address"
            },
            {
                "indexed":true,
                "internalType":"uint256",
                "name":"tokenId",
                "type":"uint256"
            }
        ],
        "name":"Approval",
        "type":"event"
    }
]

module.exports = ApprovalEvent;