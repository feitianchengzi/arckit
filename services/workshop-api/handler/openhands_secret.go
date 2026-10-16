package handler

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"
)

const openHandsConfigEncryptionKeyEnv = "OPENHANDS_CONFIG_ENCRYPTION_KEY"

func openHandsConfigEncryptionKey() ([]byte, error) {
	raw := strings.TrimSpace(os.Getenv(openHandsConfigEncryptionKeyEnv))
	if len(raw) < 32 {
		return nil, fmt.Errorf("%s must be configured with at least 32 characters", openHandsConfigEncryptionKeyEnv)
	}
	sum := sha256.Sum256([]byte(raw))
	return sum[:], nil
}

func openHandsCredentialAAD(projectID uint) []byte {
	return []byte("workshop:openhands-llm-api-key:v1:project:" + strconv.FormatUint(uint64(projectID), 10))
}

func encryptOpenHandsLLMAPIKey(projectID uint, plaintext string) (string, error) {
	key, err := openHandsConfigEncryptionKey()
	if err != nil {
		return "", err
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("create credential cipher: %w", err)
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("create credential AEAD: %w", err)
	}
	nonce := make([]byte, aead.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("create credential nonce: %w", err)
	}
	sealed := aead.Seal(nil, nonce, []byte(plaintext), openHandsCredentialAAD(projectID))
	payload := append(nonce, sealed...)
	return "v1:" + base64.RawStdEncoding.EncodeToString(payload), nil
}

func decryptOpenHandsLLMAPIKey(projectID uint, encoded string) (string, error) {
	if !strings.HasPrefix(encoded, "v1:") {
		return "", fmt.Errorf("unsupported encrypted credential version")
	}
	key, err := openHandsConfigEncryptionKey()
	if err != nil {
		return "", err
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("create credential cipher: %w", err)
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("create credential AEAD: %w", err)
	}
	payload, err := base64.RawStdEncoding.DecodeString(strings.TrimPrefix(encoded, "v1:"))
	if err != nil || len(payload) < aead.NonceSize() {
		return "", fmt.Errorf("invalid encrypted credential")
	}
	nonce, ciphertext := payload[:aead.NonceSize()], payload[aead.NonceSize():]
	plaintext, err := aead.Open(nil, nonce, ciphertext, openHandsCredentialAAD(projectID))
	if err != nil {
		return "", fmt.Errorf("decrypt project credential: %w", err)
	}
	return string(plaintext), nil
}

func configuredServerLLMAPIKey() string {
	value := strings.TrimSpace(os.Getenv("LLM_API_KEY"))
	if value == "" || strings.HasPrefix(value, "REPLACE_") {
		return ""
	}
	return value
}

func openHandsLLMKeySource(agent *OpenHandsAgent) string {
	if agent != nil && strings.TrimSpace(agent.LLMAPIKeyEncrypted) != "" {
		return "project"
	}
	if configuredServerLLMAPIKey() != "" {
		return "server"
	}
	return "none"
}

func openHandsLLMConfigured(agent *OpenHandsAgent) bool {
	return openHandsLLMKeySource(agent) != "none"
}

func resolveOpenHandsSessionAPIKey(agent *OpenHandsAgent) string {
	if agent != nil && strings.TrimSpace(agent.APIKey) != "" {
		return strings.TrimSpace(agent.APIKey)
	}
	return strings.TrimSpace(os.Getenv("OH_SESSION_API_KEYS_0"))
}
