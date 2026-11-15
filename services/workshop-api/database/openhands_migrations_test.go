package database

import (
	"strings"
	"testing"
)

func TestOpenHandsMigrationsAreEmbeddedInDeploymentOrder(t *testing.T) {
	wants := []string{
		"CREATE TABLE IF NOT EXISTS openhands_agents",
		"ALTER TABLE customer_code_repos ADD COLUMN IF NOT EXISTS repo_url",
		"CREATE TABLE IF NOT EXISTS agent_conversations",
		"ALTER TABLE agent_conversations ADD COLUMN IF NOT EXISTS custom_user_id",
		"ADD COLUMN IF NOT EXISTS llm_api_key_encrypted",
	}
	if len(openHandsMigrationPaths) != len(wants) {
		t.Fatalf("migration count = %d, want %d", len(openHandsMigrationPaths), len(wants))
	}
	for index, path := range openHandsMigrationPaths {
		content, err := openHandsMigrationFS.ReadFile(path)
		if err != nil {
			t.Fatalf("read migration %s: %v", path, err)
		}
		if !strings.Contains(string(content), wants[index]) {
			t.Fatalf("migration %s does not contain %q", path, wants[index])
		}
	}
}
