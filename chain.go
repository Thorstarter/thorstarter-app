package main

import (
	"fmt"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
)

func chainEvmCall(c *C, abiJson, chain, contract, method string, args ...interface{}) (abi.ABI, []interface{}, error) {
	abi, err := abi.JSON(strings.NewReader(abiJson))
	check(err)

	data, err := abi.Pack(method, args...)
	check(err)
	var resultStr string
	err = c.evmClients[chain].Call(&resultStr, "eth_call", map[string]interface{}{
		"from": "0x0000000000000000000000000000000000000000",
		"to":   contract,
		"data": hexutil.Bytes(data),
	}, "latest")
	if err != nil {
		return abi, nil, fmt.Errorf("chainEvmCall: %s: %s: %s: %w", chain, contract, method, err)
	}

	result, err := abi.Unpack(method, hexutil.MustDecode(resultStr))
	check(err)
	return abi, result, nil
}

func chainForgeInfo(c *C, address string) (M, error) {
	abiJson := `[{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getUserInfo","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"users","outputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"shares","type":"uint256"},{"internalType":"uint256","name":"lockTime","type":"uint256"},{"internalType":"uint256","name":"lockDays","type":"uint256"},{"internalType":"uint256","name":"unstakedTime","type":"uint256"},{"internalType":"uint256","name":"__gap1","type":"uint256"},{"internalType":"uint256","name":"__gap2","type":"uint256"}],"stateMutability":"view","type":"function"}]`
	contract := contracts["Fantom"]["forge"]
	_, result, err := chainEvmCall(c, abiJson, "Fantom", contract, "getUserInfo", common.HexToAddress(address))
	if err != nil {
		return nil, err
	}
	amount := result[0].(*big.Int)
	amount.Div(amount, big.NewInt(1000000000000))
	shares := result[1].(*big.Int)
	shares.Div(shares, big.NewInt(1000000000000))
	stakes := result[2].(*big.Int)

	_, result, err = chainEvmCall(c, abiJson, "Fantom", contract, "totalSupply")
	totalShares := result[0].(*big.Int)
	totalShares.Div(totalShares, big.NewInt(1000000000000))
	if err != nil {
		return nil, err
	}
	return M{
		"amount":      &BN{*amount},
		"shares":      &BN{*shares},
		"stakes":      int(stakes.Int64()),
		"totalShares": &BN{*totalShares},
	}, nil
}
