package router

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"log"
	"os"

	db "go-authentication-boilerplate/database"
	"go-authentication-boilerplate/models"
	auth "go-authentication-boilerplate/auth"
	
	"github.com/gofiber/fiber/v2"
	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

type ScanningRequest struct {
    ContractAddress 	string `json:"contract_address"`
    Rule                 string `json:"rule"`
    TelegramUsername	string `json:"telegram_username"`	
}

func SetupTelegramRoutes() {
    TELEGRAM.Get("/webhook", HandleTelegramWebhook)

	privTxn := TELEGRAM.Group("/private")
	privTxn.Use(auth.SecureAuth())

	privTxn.Post("/set-scanning",  HandleSetScanning)
	privTxn.Get("/get-scanning",  HandleGetScanning)
}

type ContractLookupResponse struct {
    Result struct {
        ContractLookup []struct {
            Address      string `json:"address"`
            Name        string `json:"name"`
            Abi         string `json:"abi"`
            Bytecode    string `json:"bytecode"`
            UserDoc     string `json:"userDoc"`
            DevDoc      string `json:"developerDoc"`
        } `json:"contractLookup"`
    } `json:"result"`
}

type ContractCreateRequest struct {
    Label         string `json:"label"`
    ContractName  string `json:"contractName"`
    Version       string `json:"version"`
    Bin          string `json:"bin"`
    RawAbi       string `json:"rawAbi"`
    UserDoc      string `json:"userDoc"`
    DeveloperDoc string `json:"developerDoc"`
    // Metadata     string `json:"metadata"`
    // IsFavorite   bool   `json:"isFavorite"`
}

type ContractLinkRequest struct {
    Label         string `json:"label"`

    Version      string `json:"version"`
    StartingBlock string `json:"startingBlock"`
}

// Root structure to match the JSON data
type EventEmitted struct {
	ID      string    `json:"id"`
	Event   string    `json:"event"`
	Data    EventData `json:"data"`
}

type EventData struct {
	TriggeredAt string   `json:"triggeredAt"`
	Event       Event    `json:"event"`
	RawFields   string   `json:"rawFields"`
	Contract    Contract `json:"contract"`
	IndexInLog int      `json:"indexInLog"`
	Transaction Transaction `json:"transaction"`
}

type Event struct {
	Name     string   `json:"name"`
	Signature string  `json:"signature"`
	Inputs   []Input `json:"inputs"`
}

type Input struct {
	Name   string `json:"name"`
	Value  string `json:"value"`
	Hashed bool   `json:"hashed"`
	Type   string `json:"type"`
}

type Contract struct {
	Address     string `json:"address"`
	AddressLabel string `json:"addressLabel"`
	Name        string `json:"name"`
	Label       string `json:"label"`
}

type Transaction struct {
	From         string       `json:"from"`
	TxData       string       `json:"txData"`
	TxHash       string       `json:"txHash"`
	TxIndexInBlock int        `json:"txIndexInBlock"`
	BlockHash    string       `json:"blockHash"`
	BlockNumber  int          `json:"blockNumber"`
	Contract     Contract     `json:"contract"`
	Method       Method       `json:"method"`
}

type Method struct {
	Name      string `json:"name"`
	Signature string `json:"signature"`
	Inputs    []Input `json:"inputs"`
}

func sendMessage(text, username string) error {
    botToken := os.Getenv("TELEGRAM_API_KEY")

	// Create a new bot instance
	bot, err := tgbotapi.NewBotAPI(botToken)
	if err != nil {
        log.Printf("Failed to create new bot: %v", err)
		return err
	}

	// Use ChatInfoConfig to fetch chat info based on username
	// useid 967869163
    chatConfig := tgbotapi.ChatConfig{
        ChatID: 967869163,
    }

    ChatInfoConfig := tgbotapi.ChatInfoConfig{
        chatConfig,
    }

	chat, err := bot.GetChat(ChatInfoConfig)
	if err != nil {
        log.Printf("Failed to get chat: %v", err)
		return err
	}

	// Create and send the message
	msg := tgbotapi.NewMessage(chat.ID, text)
	_, err = bot.Send(msg)
    if err != nil {
        log.Printf("Failed to send message: %v", err)
    } else {
        log.Printf("Message sent to %s", username)
    }
	return err
}


func HandleTelegramWebhook(c *fiber.Ctx) error {
    bot, err := tgbotapi.NewBotAPI(os.Getenv("TELEGRAM_API_KEY"))
    if err != nil {
    	return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
    		"success": false,
    		"message": "Failed to create telegram bot",
    		"error":   err.Error(),
    	})
    }

    bot.Debug = true

    log.Printf("Authorized on account %s", bot.Self.UserName)

    var event []EventEmitted

    if err := c.BodyParser(&event); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "success": false,
            "message": "Invalid request format",
            "error":   err.Error(),
        })
    }

    jsontmp, _ := json.Marshal(event)

    log.Printf("Event: %v", string(jsontmp))

    contractAddress := ""

    // Get the contract address
    for _, e := range event[0].Data.Event.Inputs {
        if e.Name == "contractAddress" {
            contractAddress = strings.ToLower(e.Value)
        }
    } 

    // look for contract in Scanning table
    var scanning models.Scanning
    if err := db.DB.Where("contract_address = ?", contractAddress).First(&scanning).Error; err != nil {
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
            "success": false,
            "message": "Contract not found in scanning",
            "error":   err.Error(),
        })
    }

    // Get the telegram username
    telegramUsername := scanning.TelegramUsername

    // check data and rule by sending a request to localhost:5000/evaluate
    // with POST request and data, rule being sent
    // response looks like: {"result": true} or {"result": false}
    // if result is true, send a message to telegram user
    // if result is false, do nothing

    client := &http.Client{}
    url := "http://localhost:5000/evaluate"
    data := map[string]interface{}{
        "data": event[0].Data,
        "rule": scanning.Rule,
    }

    dataBytes, err := json.Marshal(data)
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "success": false,
            "message": "Failed to marshal data",
            "error":   err.Error(),
        })
    }

    req, err := http.NewRequest("POST", url, bytes.NewBuffer(dataBytes))
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "success": false,
            "message": "Failed to create request",
            "error":   err.Error(),
        })
    }

    req.Header.Set("Content-Type", "application/json")

    resp, err := client.Do(req)
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "success": false,
            "message": "Failed to send request",
            "error":   err.Error(),
        })
    }

    var result map[string]bool
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        log.Printf("Failed to decode response: %v", err)
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "success": false,
            "message": "Failed to decode response",
            "error":   err.Error(),
        })
    }

    defer resp.Body.Close()

    log.Printf("Result[\"result\"]: %v", result["result"])

    if result["result"] {
        eventJson, _ := json.Marshal(event[0])
        log.Printf("Rule matched for contract %s\n\nEvent: %v", contractAddress, string(eventJson))

        text := fmt.Sprintf("Rule matched for contract %s\n\nEvent: \n```%v```", contractAddress, string(eventJson))

        if err := sendMessage(text, telegramUsername); err != nil {
            log.Printf("Failed to send message: %v", err)
            return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
                "success": false,
                "message": "Failed to send message",
                "error":   err.Error(),
            })
        }
    }

    return c.Status(fiber.StatusOK).JSON(fiber.Map{
        "success": true,
        "message": "Recorded event",
    })
}

func HandleGetScanning(c *fiber.Ctx) error {
	var scanning []models.Scanning
	userId := c.Locals("id").(string)
	if err := db.DB.Where("user_id = ?", userId).Find(&scanning).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to fetch scanning",
			"error":   err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    scanning,
	})
}

func HandleSetScanning(c *fiber.Ctx) error {
    // Parse request body
    var req ScanningRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "success": false,
            "message": "Invalid request format",
            "error":   err.Error(),
        })
    }

    // Validate input
    if req.ContractAddress == "" {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "success": false,
            "message": "Contract address is required",
        })
    }

    if req.Rule == "" {
        req.Rule = "True"
    }

    if len(req.TelegramUsername) == 0 {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "success": false,
            "message": "Telegram username is required",
        })
    }

    // Get contract information from Multibaas
    multiBaasToken := os.Getenv("MULTIBASS_API_KEY")
    if multiBaasToken == "" {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "success": false,
            "message": "Multibaas API key not configured",
        })
    }

    // Create HTTP client
    client := &http.Client{}

    // First API call to get contract information
    lookupURL := fmt.Sprintf("https://gh4sb6ufzzhtlgww5ue4kaszfq.multibaas.com/api/v0/chains/ethereum/addresses/%s?include=contractLookup", req.ContractAddress)
    lookupReq, err := http.NewRequest("GET", lookupURL, nil)
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "success": false,
            "message": "Failed to create lookup request",
            "error":   err.Error(),
        })
    }

    lookupReq.Header.Add("Authorization", "Bearer "+multiBaasToken)
    lookupReq.Header.Add("Accept", "application/json")

    lookupResp, err := client.Do(lookupReq)
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "success": false,
            "message": "Failed to fetch contract information",
            "error":   err.Error(),
        })
    }
    defer lookupResp.Body.Close()

    var contractLookup ContractLookupResponse
    if err := json.NewDecoder(lookupResp.Body).Decode(&contractLookup); err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "success": false,
            "message": "Failed to parse contract lookup response",
            "error":   err.Error(),
        })
    }

    if len(contractLookup.Result.ContractLookup) == 0 {
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
            "success": false,
            "message": "Contract information not found",
        })
    }

    contractInfo := contractLookup.Result.ContractLookup[0]
    createReq := ContractCreateRequest{
        Label:		   strings.ToLower(contractInfo.Name),
        ContractName:  strings.ToLower(contractInfo.Name),
        Version:       "1.0.0",
        Bin:          contractInfo.Bytecode,
        RawAbi:       contractInfo.Abi,
        UserDoc:      contractInfo.UserDoc,
        DeveloperDoc: "{}",
    }

    // Second API call to create contract
    createURL := fmt.Sprintf("https://gh4sb6ufzzhtlgww5ue4kaszfq.multibaas.com/api/v0/contracts/%s", req.ContractAddress)
    createReqBody, err := json.Marshal(createReq)
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "success": false,
            "message": "Failed to prepare contract creation request",
            "error":   err.Error(),
        })
    }

    createHttpReq, err := http.NewRequest("POST", createURL, bytes.NewBuffer(createReqBody))
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "success": false,
            "message": "Failed to create contract request",
            "error":   err.Error(),
        })
    }

    // Add your JWT token here
    jwtToken := os.Getenv("MULTIBASS_API_KEY") // Make sure to configure this
    createHttpReq.Header.Add("Authorization", "Bearer "+jwtToken)
    createHttpReq.Header.Add("Content-Type", "application/json")

    createResp, err := client.Do(createHttpReq)
    if err != nil {
		log.Printf("Create response: %v", createResp)
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "success": false,
            "message": "Failed to create contract",
            "error":   err.Error(),
        })
    }

	// print json sent to create contract
	jsonCreateReq, _ := json.Marshal(createReq)
	log.Printf("Create request: %v", string(jsonCreateReq))

	if createResp.StatusCode != http.StatusOK {
		log.Printf("Create response: %v and status code: %v", createResp, createResp.StatusCode)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to create contract",
			"error":   "Invalid status code",
		})
	}

    defer createResp.Body.Close()

	// create an address and THEN link it
    addressReq := struct {
        Label   string `json:"label"`
        Address string `json:"address"`
    }{
        Label:   strings.ToLower(contractInfo.Name),
        Address: req.ContractAddress,
    }

    addressURL := fmt.Sprintf("https://gh4sb6ufzzhtlgww5ue4kaszfq.multibaas.com/api/v0/chains/%s/addresses", "ethereum")
    addressReqBody, err := json.Marshal(addressReq)
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "success": false,
            "message": "Failed to prepare address creation request",
            "error":   err.Error(),
        })
    }

    addressHttpReq, err := http.NewRequest("POST", addressURL, bytes.NewBuffer(addressReqBody))
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "success": false,
            "message": "Failed to create address request",
            "error":   err.Error(),
        })
    }

    addressHttpReq.Header.Add("Authorization", "Bearer "+multiBaasToken)
    addressHttpReq.Header.Add("Content-Type", "application/json")

    addressResp, err := client.Do(addressHttpReq)
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "success": false,
            "message": "Failed to create address",
            "error":   err.Error(),
        })
    }
    defer addressResp.Body.Close()

    if addressResp.StatusCode != http.StatusOK && addressResp.StatusCode != http.StatusCreated {
        log.Printf("Address creation response: %v and status code: %v", addressResp, addressResp.StatusCode)
        log.Printf("Address creation request json: %v to url: %v", string(addressReqBody), addressURL)
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "success": false,
            "message": "Failed to create address",
            "error":   "Invalid status code",
        })
    }

	userId := c.Locals("id").(string)

    // Third API call to link contract
    linkReq := ContractLinkRequest{
        Label:		  strings.ToLower(contractInfo.Name),
        Version:      "1.0.0",
        StartingBlock: "latest",
    }

    linkURL := fmt.Sprintf("https://gh4sb6ufzzhtlgww5ue4kaszfq.multibaas.com/api/v0/chains/%s/addresses/%s/contracts", 
        "ethereum",
        req.ContractAddress)
    
    linkReqBody, err := json.Marshal(linkReq)
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "success": false,
            "message": "Failed to prepare contract linking request",
            "error":   err.Error(),
        })
    }

    linkHttpReq, err := http.NewRequest("POST", linkURL, bytes.NewBuffer(linkReqBody))
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "success": false,
            "message": "Failed to create contract linking request",
            "error":   err.Error(),
        })
    }

    linkHttpReq.Header.Add("Authorization", "Bearer "+multiBaasToken)
    linkHttpReq.Header.Add("Content-Type", "application/json")

    linkResp, err := client.Do(linkHttpReq)
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "success": false,
            "message": "Failed to link contract",
            "error":   err.Error(),
        })
    }

	if linkResp.StatusCode != 200 {
		log.Printf("Linking response: %v", linkResp)

		log.Printf("Linking response: %v and status code: %v", linkResp, linkResp.StatusCode)

		log.Printf("Linking request json: %v to url: %v", string(linkReqBody), linkURL)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to link contract",
			"error":   "Invalid status code",
		})
	}

    defer linkResp.Body.Close()

    // Create scanning record in database
    scanning := models.Scanning{
        ContractAddress: req.ContractAddress,
        TelegramUsername: req.TelegramUsername,
		UserID: userId,
        Rule: req.Rule,
    }

    if err := db.DB.Create(&scanning).Error; err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "success": false,
            "message": "Failed to create scanning",
            "error":   err.Error(),
        })
    }

    return c.Status(fiber.StatusCreated).JSON(fiber.Map{
        "success": true,
        "message": "Scanning and contract created successfully",
        "data":    scanning,
    })
}