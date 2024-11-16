package models

type Scanning struct {
	Base
    ContractAddress 	string    `json:"contract_address" gorm:"not null"`
	Rule 				string    `json:"rule" gorm:"not null"`
    TelegramUsername 	string     `json:"telegram_username" gorm:"not null"`
	UserID            	string    `json:"user_id" gorm:"not null"`
}
