package main

import (
	"encoding/base64"
	"errors"
	"fmt"
	"log"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
)

var _ = route("/tiers", func(c *C) {
	walletChain := c.GetCookie("walletChain")
	walletAddress := c.GetCookie("walletAddress")

	scores := c.CacheGetf("userScores:"+walletAddress, 150, func() M {
		scores := M{
			"tiersEthereum": NewBN("0", 0),
			"tiersFantom":   NewBN("0", 0),
			"tiersTerra":    NewBN("0", 0),
			"forge":         NewBN("0", 0),
			"tclp":          NewBN("0", 0),
			"mintdao":       NewBN("0", 0),
		}
		if walletAddress == "" {
			return scores
		}

		if walletChain == "Terra" {
			if s, err := chainTiersTerra(walletAddress); err == nil {
				scores.Set("tiersTerra", s)
			} else {
				log.Println("error fetching score:", err)
			}
		} else {
			if s, err := chainTiersUser(c, "Ethereum", walletAddress); err == nil {
				scores.Set("tiersEthereum", s)
			} else {
				log.Println("error fetching score:", err)
			}
			if s, err := chainTiersSimpleUser(c, "Fantom", walletAddress); err == nil {
				scores.Set("tiersFantom", s)
			} else {
				log.Println("error fetching score:", err)
			}
			if s, err := chainForgeUser(c, walletAddress); err == nil {
				scores.Set("forge", s)
			} else {
				log.Println("error fetching score:", err)
			}
			if s, err := chainThorchainLpXrune(walletAddress); err == nil {
				scores.Set("tclp", s)
			} else {
				log.Println("error fetching score:", err)
			}
		}
		if s, err := chainMintDAOBoost(walletChain, walletAddress); err == nil {
			scores.Set("mintdao", s)
		} else {
			log.Println("error fetching score:", err)
		}

		scores["total"] = scores.GetBN("tiersEthereum").
			Add(scores.GetBN("tiersFantom")).
			Add(scores.GetBN("tiersTerra")).
			Add(scores.GetBN("forge")).
			Add(scores.GetBN("tclp")).
			Add(scores.GetBN("mintdao"))
		return scores
	})

	balances := c.CacheGetf("userBalances:"+walletAddress, 30, func() M {
		balances := M{"xrune": BNZero}
		if walletChain == "Ethereum" || walletChain == "Fantom" {
			contract := contracts[walletChain]["xrune"]
			if s, err := chainTokenBalance(c, walletChain, contract, walletAddress); err == nil {
				balances.Set("xrune", s)
			} else {
				log.Println("error fetching balance:", err)
			}
		}
		if walletChain == "Terra" {
			contract := contracts[walletChain]["xrune"]
			if s, err := chainTerraTokenBalance(contract, walletAddress); err == nil {
				balances.Set("xrune", s)
			} else {
				log.Println("error fetching balance:", err)
			}
		}
		return balances
	})

	scoreSources := []string{}
	if walletChain == "Terra" {
		scoreSources = []string{
			h("tr", nil,
				h("td", nil, "Tiers"),
				h("td", nil, scores.GetBN("tiersTerra").Format(6, 1)),
				h("td", M{"class": "text-right"},
					h("button", M{"class": "button button-small mr-4",
						"onclick": "javascript:toggle('#depositModal');"}, "Deposit"),
					h("button", M{"class": "button button-small",
						"onclick": "javascript:toggle('#withdrawModal');"}, "Withdraw"),
				),
			),
			h("tr", nil,
				h("td", nil, "MintDAO NFT"),
				h("td", nil, scores.GetBN("mintdao").Format(6, 1)),
				h("td", nil),
			),
		}
	} else {
		scoreSources = []string{
			h("tr", nil,
				h("td", nil, "Tiers Ethereum"),
				h("td", nil, scores.GetBN("tiersEthereum").Format(6, 1)),
				h("td", M{"class": "text-right"},
					tern(walletChain == "Ethereum", h("button", M{"class": "button button-small mr-4",
						"onclick": "javascript:toggle('#depositModal');"}, "Deposit"), ""),
					tern(walletChain == "Ethereum", h("button", M{"class": "button button-small",
						"onclick": "javascript:toggle('#withdrawModal');"}, "Withdraw"), ""),
				),
			),
			h("tr", nil,
				h("td", nil, "Tiers Fantom"),
				h("td", nil, scores.GetBN("tiersFantom").Format(6, 1)),
				h("td", M{"class": "text-right"},
					tern(walletChain == "Fantom", h("button", M{"class": "button button-small mr-4",
						"onclick": "javascript:toggle('#depositModal');"}, "Deposit"), ""),
					tern(walletChain == "Fantom", h("button", M{"class": "button button-small",
						"onclick": "javascript:toggle('#withdrawModal');"}, "Withdraw"), ""),
				),
			),
			h("tr", nil,
				h("td", nil, "Forge"),
				h("td", nil, scores.GetBN("forge").Format(6, 1)),
				h("td", nil),
			),
			h("tr", nil,
				h("td", nil, "THORChain LP XRUNE"),
				h("td", nil, scores.GetBN("tclp").Format(6, 1)),
				h("td", nil),
			),
			h("tr", nil,
				h("td", nil, "MintDAO NFT"),
				h("td", nil, scores.GetBN("mintdao").Format(6, 1)),
				h("td", nil),
			),
		}
	}

	c.Html(200, layoutApp(c, "Tiers",
		divc("container",
			divc("tiers-score",
				h("h2", M{}, scores.GetBN("total").Format(6, 0)),
				h("span", M{}, "Thorstarter Score"),
			),
			h("h1", M{"class": "title"}, "Tiers"),
			h("table", M{"class": "table text-lg"},
				h("thead", nil,
					h("tr", nil,
						h("th", nil, "Source"),
						h("th", nil, "Score"),
						h("th", nil),
					),
				),
				h("tbody", nil, scoreSources...),
			),
			h("div", M{"id": "depositModal", "class": "modal hide", "onclick": "toggle('#depositModal')"},
				h("form", M{"class": "modal-content", "onclick": "event.stopPropagation()", "onsubmit": "tiersDeposit()"},
					h("h2", M{}, "Deposit"),
					divc("field",
						divc("label", "Amount (Balance: "+balances.GetBN("xrune").Format(6, 4)+")"),
						h("input", M{"class": "input", "id": "depositAmount", "placeholder": "0.0"}),
					),
					h("button", M{"type": "submit", "class": "button w-full"}, "Deposit"),
				),
			),
			h("div", M{"id": "withdrawModal", "class": "modal hide", "onclick": "toggle('#withdrawModal')"},
				h("form", M{"class": "modal-content", "onclick": "event.stopPropagation()", "onsubmit": "tiersWithdraw()"},
					h("h2", M{}, "Withdraw"),
					divc("field",
						divc("label", "Amount (Deposited: "+scores.GetBN("tiers"+walletChain).Format(6, 4)+")"),
						h("input", M{"class": "input", "id": "withdrawAmount", "placeholder": "0.0"}),
					),
					h("button", M{"type": "submit", "class": "button w-full"}, "Withdraw"),
				),
			),
		),
	))
})

func chainThorchainLpXrune(address string) (*BN, error) {
	poolName := "ETH.XRUNE-0X69FA0FEE221AD11012BAB0FDB45D444D3D2CE71C"
	res, err := httpGet("https://midgard.thorchain.info/v2/member/" + address)
	if err != nil {
		return nil, fmt.Errorf("chainThorchainLpXrune: %w", err)
	}

	unitsStr := ""
	for _, i := range res.(map[string]interface{})["pools"].([]interface{}) {
		pool := i.(map[string]interface{})
		if pool["pool"].(string) == poolName {
			unitsStr = pool["liquidityUnits"].(string)
			break
		}
	}
	if unitsStr == "" {
		return nil, errors.New("chainThorchainLpXrune: could not find pool: " + poolName)
	}

	poolI, err := httpGet("https://midgard.thorchain.info/v2/pool/" + poolName)
	if err != nil {
		return nil, fmt.Errorf("chainThorchainLpXrune: %w", err)
	}

	pool := M(poolI.(map[string]interface{}))
	units := big.NewInt(int64(stringToInt(unitsStr)))
	unitsTotal := big.NewInt(int64(stringToInt(pool.Get("liquidityUnits"))))
	depth := big.NewInt(int64(stringToInt(pool.Get("assetDepth"))))
	units.Mul(units, depth)
	units.Div(units, unitsTotal)
	units.Div(units, big.NewInt(100))
	return &BN{*units}, nil
}

func chainTerraTokenBalance(contract string, address string) (*BN, error) {
	query := fmt.Sprintf(`{"balance":{"address":"%s"}}`, address)
	b64query := base64.URLEncoding.EncodeToString([]byte(query))
	url := "https://fcd.terra.dev/terra/wasm/v1beta1/contracts/%s/store?query_msg=%s"
	result, err := httpGet(fmt.Sprintf(url, contract, b64query))
	if err != nil {
		return nil, fmt.Errorf("chainTerraTokenBalance: %w", err)
	}

	state := result.(map[string]interface{})["query_result"].(map[string]interface{})
	balance := big.NewInt(int64(stringToInt(state["balance"].(string))))
	return &BN{*balance}, nil
}

func chainMintDAOBoost(chain string, address string) (*BN, error) {
	query := ""
	if chain == "Terra" {
		query = fmt.Sprintf(`{"thorstarter_terra_boost":{"terra_address":"%s"}}`, address)
	} else {
		query = fmt.Sprintf(`{"thorstarter_eth_boost":{"eth_address":"%s"}}`, address)
	}
	b64query := base64.URLEncoding.EncodeToString([]byte(query))
	contract := "terra10pxt36lyy6rhsumw7j8lahwvwrre7fxrfktgjl"
	url := "https://fcd.terra.dev/terra/wasm/v1beta1/contracts/%s/store?query_msg=%s"
	result, err := httpGet(fmt.Sprintf(url, contract, b64query))
	if err != nil {
		return nil, fmt.Errorf("chainMintDAOBoost: %w", err)
	}

	state := result.(map[string]interface{})["query_result"].(string)
	balance := big.NewInt(int64(stringToInt(state)))
	return &BN{*balance}, nil
}

func chainTiersTerra(address string) (*BN, error) {
	query := fmt.Sprintf(`{"user_state":{"user":"%s"}}`, address)
	b64query := base64.URLEncoding.EncodeToString([]byte(query))
	contract := "terra18s7n93ja9nh37mttu66rhtsw05dxrcpsmw0c45"
	url := "https://fcd.terra.dev/terra/wasm/v1beta1/contracts/%s/store?query_msg=%s"
	result, err := httpGet(fmt.Sprintf(url, contract, b64query))
	if err != nil {
		return nil, fmt.Errorf("chainTiersTerra: %w", err)
	}

	state := result.(map[string]interface{})["query_result"].(map[string]interface{})
	balance := big.NewInt(int64(stringToInt(state["balance"].(string))))
	return &BN{*balance}, nil
}

func chainTiersUser(c *C, chain string, address string) (*BN, error) {
	addresses := map[string]string{"Ethereum": "0x817ba0ecafD58460bC215316a7831220BFF11C80"}
	abiJson := `[{"inputs": [{"internalType": "address","name": "user","type": "address"}],"name": "userInfoAmounts","outputs": [{"internalType": "uint256","name": "","type": "uint256"},{"internalType": "uint256","name": "","type": "uint256"},{ "internalType": "address[]", "name": "", "type": "address[]" }, { "internalType": "uint256[]", "name": "", "type": "uint256[]" }, { "internalType": "uint256[]", "name": "", "type": "uint256[]" }],"stateMutability": "view","type": "function"}]`
	abi, err := abi.JSON(strings.NewReader(abiJson))
	check(err)

	data, err := abi.Pack("userInfoAmounts", common.HexToAddress(address))
	check(err)
	var resultStr string
	err = c.evmClients[chain].Call(&resultStr, "eth_call", map[string]interface{}{
		"from": "0x0000000000000000000000000000000000000000",
		"to":   addresses[chain],
		"data": hexutil.Bytes(data),
	}, "latest")
	if err != nil {
		return nil, fmt.Errorf("chainTiersUser: %w", err)
	}

	result, err := abi.Unpack("userInfoAmounts", hexutil.MustDecode(resultStr))
	check(err)
	amountb := result[4].([]*big.Int)[0]
	amountb.Div(amountb, big.NewInt(1000000000000))
	return &BN{*amountb}, nil
}

func chainTiersSimpleUser(c *C, chain string, address string) (*BN, error) {
	addresses := map[string]string{"Fantom": "0xbc373f851d1EC6aaba27a9d039948D25a6EE8036"}
	abiJson := `[{"inputs": [{"internalType": "address","name": "","type": "address"}],"name": "userInfos","outputs": [{"internalType": "uint256","name": "","type": "uint256"},{"internalType": "uint256","name": "","type": "uint256"}],"stateMutability": "view","type": "function"}]`
	abi, err := abi.JSON(strings.NewReader(abiJson))
	check(err)

	data, err := abi.Pack("userInfos", common.HexToAddress(address))
	check(err)
	var resultStr string
	err = c.evmClients[chain].Call(&resultStr, "eth_call", map[string]interface{}{
		"from": "0x0000000000000000000000000000000000000000",
		"to":   addresses[chain],
		"data": hexutil.Bytes(data),
	}, "latest")
	if err != nil {
		return nil, fmt.Errorf("chainTiersSimpleUser: %w", err)
	}

	result, err := abi.Unpack("userInfos", hexutil.MustDecode(resultStr))
	check(err)
	amount := result[0].(*big.Int)
	amount.Div(amount, big.NewInt(1000000000000))
	return &BN{*amount}, nil
}

func chainForgeUser(c *C, address string) (*BN, error) {
	contract := "0x2D23039c1bA153C6afcF7CaB9ad4570bCbF80F56"
	abiJson := `[{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getUserInfo","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]`
	abi, err := abi.JSON(strings.NewReader(abiJson))
	check(err)

	data, err := abi.Pack("getUserInfo", common.HexToAddress(address))
	check(err)
	var resultStr string
	err = c.evmClients["Fantom"].Call(&resultStr, "eth_call", map[string]interface{}{
		"from": "0x0000000000000000000000000000000000000000",
		"to":   contract,
		"data": hexutil.Bytes(data),
	}, "latest")
	if err != nil {
		return nil, fmt.Errorf("chainForgeUser: %w", err)
	}

	result, err := abi.Unpack("getUserInfo", hexutil.MustDecode(resultStr))
	check(err)
	amount := result[0].(*big.Int)
	amount.Div(amount, big.NewInt(1000000000000))
	return &BN{*amount}, nil
}

func chainTokenBalance(c *C, chain string, contract string, address string) (*BN, error) {
	abiJson := `[{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]`
	abi, err := abi.JSON(strings.NewReader(abiJson))
	check(err)

	data, err := abi.Pack("balanceOf", common.HexToAddress(address))
	check(err)
	var resultStr string
	err = c.evmClients[chain].Call(&resultStr, "eth_call", map[string]interface{}{
		"from": "0x0000000000000000000000000000000000000000",
		"to":   contract,
		"data": hexutil.Bytes(data),
	}, "latest")
	if err != nil {
		return nil, fmt.Errorf("chainTokenBalance: %w", err)
	}

	result, err := abi.Unpack("balanceOf", hexutil.MustDecode(resultStr))
	check(err)
	amount := result[0].(*big.Int)
	amount.Div(amount, big.NewInt(1000000000000))
	return &BN{*amount}, nil
}
